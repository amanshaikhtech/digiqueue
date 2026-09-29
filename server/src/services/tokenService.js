const prisma = require('../config/prisma');
const socketService = require('./socketService');

class TokenService {
  /**
   * Concurrently issues an atomic sequential token for a doctor's active session
   * Uses row-level locking (SELECT ... FOR UPDATE) on the doctor's active session.
   */
  async issueToken({ patientName, patientAge, guardianName, guardianPhone, doctorId }) {
    return await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: { isActive: true },
      });

      if (!doctor || !doctor.isActive) {
        const error = new Error('This doctor is unavailable for check-in. Please contact the clinic.');
        error.statusCode = 400;
        error.code = 'DOCTOR_UNAVAILABLE';
        throw error;
      }

      // 1. Lock the active session row to prevent race conditions during token sequence allocation
      const activeSessions = await tx.$queryRaw`
        SELECT id, doctor_id, current_token_count, ended_at 
        FROM "Sessions" 
        WHERE doctor_id = ${doctorId} AND ended_at IS NULL 
        FOR UPDATE
      `;

      if (!activeSessions || activeSessions.length === 0) {
        const error = new Error('Clinic is not currently accepting patients. No active session open.');
        error.statusCode = 400;
        error.code = 'NO_ACTIVE_SESSION';
        throw error;
      }

      const activeSession = activeSessions[0];
      const nextTokenNumber = (activeSession.current_token_count || 0) + 1;

      // 2. Atomically update session token counter
      await tx.session.update({
        where: { id: activeSession.id },
        data: { currentTokenCount: nextTokenNumber },
      });

      // 3. Create the new token
      const token = await tx.token.create({
        data: {
          doctorId,
          sessionId: activeSession.id,
          patientName,
          patientAge,
          guardianName,
          guardianPhone,
          tokenNumber: nextTokenNumber,
          status: 'waiting',
        },
        include: {
          doctor: {
            include: { clinic: true },
          },
        },
      });

      // 4. Calculate patients waiting ahead in the same session
      const aheadCount = await tx.token.count({
        where: {
          sessionId: activeSession.id,
          tokenNumber: { lt: nextTokenNumber },
          status: 'waiting',
        },
      });

      // 5. Total waiting count in session
      const waitingCount = await tx.token.count({
        where: {
          sessionId: activeSession.id,
          status: 'waiting',
        },
      });

      // 6. Broadcast to doctor's dedicated socket room
      socketService.notifyTokenIssued(doctorId, {
        token: {
          id: token.id,
          tokenNumber: token.tokenNumber,
          patientName: token.patientName,
          status: token.status,
          createdAt: token.createdAt,
        },
        aheadCount,
        waitingCount,
        sessionId: activeSession.id,
      });

      socketService.notifyQueueUpdated(doctorId, {
        doctorId,
        sessionId: activeSession.id,
        action: 'new-token',
        waitingCount,
      });

      return {
        token,
        aheadCount,
        sessionId: activeSession.id,
      };
    });
  }

  /**
   * Retrieves live status of a token, including patients ahead and active serving token
   */
  async getTokenStatus(tokenId) {
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        doctor: {
          include: { clinic: true },
        },
        session: true,
      },
    });

    if (!token) {
      const error = new Error('Token not found.');
      error.statusCode = 404;
      throw error;
    }

    // Count tokens waiting ahead in the SAME session
    const aheadCount = await prisma.token.count({
      where: {
        sessionId: token.sessionId,
        tokenNumber: { lt: token.tokenNumber },
        status: 'waiting',
      },
    });

    const activeSession = await prisma.session.findFirst({
      where: {
        doctorId: token.doctorId,
        endedAt: null,
      },
    });

    // Only show a patient currently being served in the doctor's open session.
    const currentServing = await prisma.token.findFirst({
      where: {
        sessionId: activeSession?.id || '',
        status: 'in_consultation',
      },
      select: {
        id: true,
        tokenNumber: true,
        patientName: true,
      },
    });

    const isSessionActive = token.session && token.session.endedAt === null;

    return {
      token: {
        id: token.id,
        tokenNumber: token.tokenNumber,
        patientName: token.patientName,
        guardianName: token.guardianName,
        guardianPhone: token.guardianPhone,
        patientAge: token.patientAge,
        status: token.status,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
        doctor: {
          id: token.doctor.id,
          name: token.doctor.name,
          specialization: token.doctor.specialization,
          clinic: token.doctor.clinic,
        },
      },
      aheadCount,
      currentServing,
      isSessionActive,
      sessionId: token.sessionId,
    };
  }

  /**
   * Advances the queue for a doctor's active session:
   * 1. Marks current 'in-consultation' token as 'completed'
   * 2. Promotes lowest 'waiting' token to 'in-consultation'
   */
  async advanceQueue(doctorId, actingUserId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Locate open active session
      const activeSession = await tx.session.findFirst({
        where: {
          doctorId,
          endedAt: null,
        },
      });

      if (!activeSession) {
        const error = new Error('No active session found for this doctor.');
        error.statusCode = 400;
        throw error;
      }

      // 2. Mark current 'in_consultation' token 'completed' if any exists
      const currentConsultation = await tx.token.findFirst({
        where: {
          sessionId: activeSession.id,
          status: 'in_consultation',
        },
      });

      let completedToken = null;
      if (currentConsultation) {
        completedToken = await tx.token.update({
          where: { id: currentConsultation.id },
          data: {
            status: 'completed',
            updatedBy: actingUserId,
          },
        });
      }

      // 3. Find lowest token_number in 'waiting' state
      const nextWaiting = await tx.token.findFirst({
        where: {
          sessionId: activeSession.id,
          status: 'waiting',
        },
        orderBy: {
          tokenNumber: 'asc',
        },
      });

      if (!nextWaiting) {
        // Queue is empty
        const remainingWaiting = 0;
        socketService.notifyQueueUpdated(doctorId, {
          doctorId,
          sessionId: activeSession.id,
          action: 'next-called',
          currentServing: null,
          waitingCount: 0,
          completedToken,
        });

        return {
          queueEmpty: true,
          message: 'Queue is empty. No more waiting patients.',
          completedToken,
          promotedToken: null,
        };
      }

      // 4. Promote next waiting token to 'in_consultation'
      const promotedToken = await tx.token.update({
        where: { id: nextWaiting.id },
        data: {
          status: 'in_consultation',
          updatedBy: actingUserId,
        },
      });

      // 5. Query updated queue stats
      const waitingCount = await tx.token.count({
        where: {
          sessionId: activeSession.id,
          status: 'waiting',
        },
      });

      // 6. Broadcast updates to doctor's room
      socketService.notifyTokenStatusChanged(doctorId, {
        tokenId: promotedToken.id,
        tokenNumber: promotedToken.tokenNumber,
        patientName: promotedToken.patientName,
        status: 'in-consultation',
        completedTokenId: completedToken ? completedToken.id : null,
      });

      socketService.notifyQueueUpdated(doctorId, {
        doctorId,
        sessionId: activeSession.id,
        action: 'next-called',
        currentServing: {
          id: promotedToken.id,
          tokenNumber: promotedToken.tokenNumber,
          patientName: promotedToken.patientName,
        },
        waitingCount,
        completedToken,
      });

      return {
        queueEmpty: false,
        promotedToken,
        completedToken,
      };
    });
  }

  async completeCurrentToken(doctorId, actingUserId) {
    return await prisma.$transaction(async (tx) => {
      const activeSession = await tx.session.findFirst({
        where: { doctorId, endedAt: null },
      });

      if (!activeSession) {
        const error = new Error('No active session found for this doctor.');
        error.statusCode = 400;
        throw error;
      }

      const currentConsultation = await tx.token.findFirst({
        where: {
          sessionId: activeSession.id,
          status: 'in_consultation',
        },
      });

      if (!currentConsultation) {
        const error = new Error('There is no patient currently in consultation.');
        error.statusCode = 400;
        throw error;
      }

      const completedToken = await tx.token.update({
        where: { id: currentConsultation.id },
        data: {
          status: 'completed',
          updatedBy: actingUserId,
        },
      });

      const waitingCount = await tx.token.count({
        where: {
          sessionId: activeSession.id,
          status: 'waiting',
        },
      });

      socketService.notifyTokenStatusChanged(doctorId, {
        tokenId: completedToken.id,
        tokenNumber: completedToken.tokenNumber,
        status: 'completed',
      });

      socketService.notifyQueueUpdated(doctorId, {
        doctorId,
        sessionId: activeSession.id,
        action: 'patient-completed',
        currentServing: null,
        waitingCount,
        completedToken,
      });

      return { completedToken, waitingCount };
    });
  }

  /**
   * Marks a token as 'no-show' and updates queue
   */
  async markNoShow(tokenId, actingUserId) {
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { session: true },
    });

    if (!token) {
      const error = new Error('Token not found.');
      error.statusCode = 404;
      throw error;
    }

    if (token.status === 'completed' || token.status === 'no_show') {
      const error = new Error(`Token is already ${token.status}.`);
      error.statusCode = 400;
      throw error;
    }

    const updatedToken = await prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'no_show',
        updatedBy: actingUserId,
      },
    });

    // Notify room
    socketService.notifyTokenStatusChanged(token.doctorId, {
      tokenId: updatedToken.id,
      tokenNumber: updatedToken.tokenNumber,
      status: 'no-show',
    });

    const waitingCount = await prisma.token.count({
      where: {
        sessionId: token.sessionId,
        status: 'waiting',
      },
    });

    socketService.notifyQueueUpdated(token.doctorId, {
      doctorId: token.doctorId,
      sessionId: token.sessionId,
      action: 'no-show',
      waitingCount,
    });

    return updatedToken;
  }

  /**
   * Closes doctor's open session, marks remaining waiting tokens as 'carried-over',
   * starts a fresh session restarting token numbers at 1, and notifies room.
   */
  async resetSession(doctorId, actingUserId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Locate current open session
      const currentSession = await tx.session.findFirst({
        where: {
          doctorId,
          endedAt: null,
        },
      });

      let oldSessionId = null;
      let carriedOverCount = 0;

      if (currentSession) {
        oldSessionId = currentSession.id;

        // Close current session
        await tx.session.update({
          where: { id: currentSession.id },
          data: { endedAt: new Date() },
        });

        // Mark remaining waiting tokens as 'carried_over'
        const carryOverResult = await tx.token.updateMany({
          where: {
            sessionId: currentSession.id,
            status: 'waiting',
          },
          data: {
            status: 'carried_over',
            updatedBy: actingUserId,
          },
        });
        carriedOverCount = carryOverResult.count;
      }

      // 2. Open brand new session starting token count at 0
      const newSession = await tx.session.create({
        data: {
          doctorId,
          startedBy: actingUserId,
          currentTokenCount: 0,
          startedAt: new Date(),
        },
      });

      // 3. Broadcast session-reset event to doctor's room
      socketService.notifySessionReset(doctorId, {
        doctorId,
        oldSessionId,
        newSessionId: newSession.id,
        carriedOverCount,
        message: 'This clinic session has ended. Please check in again for the new session.',
      });

      socketService.notifyQueueUpdated(doctorId, {
        doctorId,
        sessionId: newSession.id,
        action: 'session-reset',
        currentServing: null,
        waitingCount: 0,
      });

      return {
        oldSessionId,
        newSession,
        carriedOverCount,
      };
    });
  }

  /**
   * Retrieves full queue and stats for doctor's active session
   */
  async getDoctorQueue(doctorId) {
    const activeSession = await prisma.session.findFirst({
      where: {
        doctorId,
        endedAt: null,
      },
      include: {
        doctor: {
          include: { clinic: true },
        },
      },
    });

    if (!activeSession) {
      return {
        hasActiveSession: false,
        session: null,
        currentServing: null,
        waitingTokens: [],
        completedTokens: [],
        noShowTokens: [],
        totalToday: 0,
      };
    }

    const tokens = await prisma.token.findMany({
      where: { sessionId: activeSession.id },
      orderBy: { tokenNumber: 'asc' },
    });

    const currentServing = tokens.find((t) => t.status === 'in_consultation') || null;
    const waitingTokens = tokens.filter((t) => t.status === 'waiting');
    const completedTokens = tokens.filter((t) => t.status === 'completed');
    const noShowTokens = tokens.filter((t) => t.status === 'no_show');
    const carriedOverTokens = tokens.filter((t) => t.status === 'carried_over');

    return {
      hasActiveSession: true,
      session: activeSession,
      currentServing,
      waitingTokens,
      completedTokens,
      noShowTokens,
      carriedOverTokens,
      totalCount: tokens.length,
      waitingCount: waitingTokens.length,
    };
  }
}

module.exports = new TokenService();
