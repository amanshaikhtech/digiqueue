const prisma = require('../config/prisma');
const tokenService = require('../services/tokenService');
const qrService = require('../services/qrService');

class DoctorController {
  /**
   * GET /api/doctors/clinic/:clinicId
   * Public or staff: list active doctors for clinic
   */
  async getDoctorsByClinic(req, res) {
    try {
      const { clinicId } = req.params;
      const doctors = await prisma.doctor.findMany({
        where: { clinicId, isActive: true },
        include: {
          sessions: {
            where: { endedAt: null },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
      });

      const formatted = doctors.map((doc) => ({
        id: doc.id,
        clinicId: doc.clinicId,
        name: doc.name,
        specialization: doc.specialization,
        isActive: doc.isActive,
        hasActiveSession: doc.sessions.length > 0,
        activeSessionId: doc.sessions[0]?.id || null,
      }));

      return res.json({ success: true, data: formatted });
    } catch (err) {
      console.error('Error fetching doctors by clinic:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve doctors.' });
    }
  }

  /**
   * GET /api/doctors/:id/qr
   * Generates check-in QR code Data URL & check-in link for doctor
   */
  async getDoctorQR(req, res) {
    try {
      const doctorId = req.params.id;
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { clinic: true },
      });

      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }

      const clientOrigin = process.env.PUBLIC_APP_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0];
      const { qrDataUrl, checkInUrl } = await qrService.generateCheckInQRDataUrl(
        doctor.clinicId,
        doctor.id,
        clientOrigin
      );

      return res.json({
        success: true,
        data: {
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialization: doctor.specialization,
          clinicId: doctor.clinicId,
          clinicName: doctor.clinic.name,
          qrDataUrl,
          checkInUrl,
        },
      });
    } catch (err) {
      console.error('Error generating doctor QR:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate QR code.' });
    }
  }

  /**
   * GET /api/doctors/:id/current-session
   * Authenticated (supervisor / admin)
   */
  async getCurrentSession(req, res) {
    try {
      const doctorId = req.params.id;
      const queueData = await tokenService.getDoctorQueue(doctorId);

      return res.json({
        success: true,
        data: queueData,
      });
    } catch (err) {
      console.error('Error getting current doctor session:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve current doctor session.' });
    }
  }

  /**
   * POST /api/doctors/:id/reset-session
   * Requires supervisor or admin, clinic-scoped
   */
  async resetSession(req, res) {
    try {
      const doctorId = req.params.id;
      const result = await tokenService.resetSession(doctorId, req.user.id);

      return res.json({
        success: true,
        message: 'Doctor session reset successfully. Token numbering restarts at 1.',
        data: result,
      });
    } catch (err) {
      console.error('Error resetting doctor session:', err);
      return res.status(500).json({ success: false, message: 'Failed to reset doctor session.' });
    }
  }

  /**
   * PATCH /api/doctors/:id/next
   * Requires supervisor or admin, clinic-scoped
   */
  async callNext(req, res) {
    try {
      const doctorId = req.params.id;
      const result = await tokenService.advanceQueue(doctorId, req.user.id);

      if (result.queueEmpty) {
        return res.json({
          success: true,
          queueEmpty: true,
          message: 'Queue is empty. No more waiting patients.',
          data: result,
        });
      }

      return res.json({
        success: true,
        queueEmpty: false,
        message: `Token #${result.promotedToken.tokenNumber} (${result.promotedToken.patientName}) called for consultation.`,
        data: result,
      });
    } catch (err) {
      console.error('Error calling next patient:', err);
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: 'Failed to advance queue.' });
    }
  }

  async completeCurrent(req, res) {
    try {
      const result = await tokenService.completeCurrentToken(req.params.id, req.user.id);
      return res.json({
        success: true,
        message: `Token #${result.completedToken.tokenNumber} marked as completed.`,
        data: result,
      });
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, message: err.message });
      }
      console.error('Error completing current patient:', err);
      return res.status(500).json({ success: false, message: 'Failed to complete current patient.' });
    }
  }

  /**
   * GET /api/doctors/:id/analytics
   * Requires supervisor or admin, clinic-scoped
   * Generates wait-time analytics, session throughput, and hourly distribution
   */
  async getDoctorAnalytics(req, res) {
    try {
      const doctorId = req.params.id;

      const activeSession = await prisma.session.findFirst({
        where: { doctorId, endedAt: null },
      });

      const tokens = activeSession
        ? await prisma.token.findMany({
        where: { sessionId: activeSession.id },
        orderBy: { createdAt: 'asc' },
        include: { session: true },
      })
        : [];

      // 1. Status Breakdown
      const statusCounts = {
        waiting: 0,
        in_consultation: 0,
        completed: 0,
        no_show: 0,
        carried_over: 0,
      };

      let totalWaitMinutes = 0;
      let completedWithWaitCount = 0;

      // Group by hour of creation (00:00 to 23:00)
      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        tokensIssued: 0,
        completed: 0,
      }));

      // Recent session tokens for wait-time trend
      const waitTimeTrend = [];

      tokens.forEach((t) => {
        // Status counts
        if (statusCounts[t.status] !== undefined) {
          statusCounts[t.status]++;
        }

        // Hourly volume
        const hour = new Date(t.createdAt).getHours();
        hourlyDistribution[hour].tokensIssued++;
        if (t.status === 'completed') {
          hourlyDistribution[hour].completed++;
        }

        // Wait time calculation (createdAt to updatedAt for completed or in-consultation)
        if (t.status === 'completed') {
          const waitMs = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
          const waitMins = Math.max(1, Math.round(waitMs / (1000 * 60)));
          totalWaitMinutes += waitMins;
          completedWithWaitCount++;

          if (waitTimeTrend.length < 20) {
            waitTimeTrend.push({
              tokenNumber: `#${t.tokenNumber}`,
              patientName: t.patientName,
              waitMinutes: waitMins,
              status: t.status,
            });
          }
        }
      });

      const avgWaitMinutes = completedWithWaitCount > 0
        ? Math.round(totalWaitMinutes / completedWithWaitCount)
        : null;

      // Status chart array for Recharts PieChart
      const statusDistribution = [
        { name: 'Waiting', value: statusCounts.waiting, color: '#f59e0b' },
        { name: 'In Consultation', value: statusCounts.in_consultation, color: '#10b981' },
        { name: 'Completed', value: statusCounts.completed, color: '#3b82f6' },
        { name: 'No Show', value: statusCounts.no_show, color: '#ef4444' },
        { name: 'Carried Over', value: statusCounts.carried_over, color: '#6b7280' },
      ];

      return res.json({
        success: true,
        data: {
          summary: {
            totalTokens: tokens.length,
            completedTokens: statusCounts.completed,
            waitingTokens: statusCounts.waiting,
            noShowTokens: statusCounts.no_show,
            avgWaitMinutes,
          },
          statusDistribution,
          hourlyDistribution: hourlyDistribution.slice(8, 20), // 8 AM to 8 PM clinic hours
          waitTimeTrend,
        },
      });
    } catch (err) {
      console.error('Error generating analytics:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve analytics.' });
    }
  }
}

module.exports = new DoctorController();
