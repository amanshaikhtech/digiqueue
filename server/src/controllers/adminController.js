const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

class AdminController {
  // --- Clinics ---
  async getClinics(req, res) {
    try {
      const clinics = await prisma.clinic.findMany({
        include: {
          doctors: true,
          users: {
            where: { role: 'supervisor' },
            select: { id: true, name: true, email: true, isActive: true },
          },
          _count: { select: { doctors: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, data: clinics });
    } catch (err) {
      console.error('Error fetching clinics:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch clinics.' });
    }
  }

  async createClinic(req, res) {
    try {
      const { name, address } = req.body;
      if (!name || !address) {
        return res.status(400).json({ success: false, message: 'Clinic name and address are required.' });
      }

      const clinic = await prisma.clinic.create({
        data: { name: name.trim(), address: address.trim() },
      });
      return res.status(201).json({ success: true, data: clinic });
    } catch (err) {
      console.error('Error creating clinic:', err);
      return res.status(500).json({ success: false, message: 'Failed to create clinic.' });
    }
  }

  // --- Doctors ---
  async getDoctors(req, res) {
    try {
      const doctors = await prisma.doctor.findMany({
        include: {
          clinic: true,
          sessions: {
            where: { endedAt: null },
            take: 1,
          },
          _count: { select: { tokens: true, sessions: true } },
        },
        orderBy: { name: 'asc' },
      });

      const formatted = doctors.map((doc) => ({
        id: doc.id,
        clinicId: doc.clinicId,
        clinicName: doc.clinic.name,
        name: doc.name,
        specialization: doc.specialization,
        isActive: doc.isActive,
        hasOpenSession: doc.sessions.length > 0,
        openSessionId: doc.sessions[0]?.id || null,
        totalTokens: doc._count.tokens,
      }));

      return res.json({ success: true, data: formatted });
    } catch (err) {
      console.error('Error fetching doctors:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
    }
  }

  async createDoctor(req, res) {
    try {
      const { clinicId, name, specialization } = req.body;
      if (!clinicId || !name || !specialization) {
        return res.status(400).json({
          success: false,
          message: 'clinicId, name, and specialization are required.',
        });
      }

      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) {
        return res.status(404).json({ success: false, message: 'Clinic not found.' });
      }

      const doctor = await prisma.doctor.create({
        data: {
          clinicId,
          name: name.trim(),
          specialization: specialization.trim(),
          isActive: true,
        },
        include: { clinic: true },
      });

      // Automatically create initial open session for new doctor started by admin
      await prisma.session.create({
        data: {
          doctorId: doctor.id,
          startedBy: req.user.id,
          currentTokenCount: 0,
        },
      });

      return res.status(201).json({ success: true, data: doctor });
    } catch (err) {
      console.error('Error creating doctor:', err);
      return res.status(500).json({ success: false, message: 'Failed to create doctor.' });
    }
  }

  async toggleDoctorActive(req, res) {
    try {
      const doctorId = req.params.id;
      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }

      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: { isActive: !doctor.isActive },
      });

      return res.json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to toggle doctor status.' });
    }
  }

  // --- Supervisors ---
  async getSupervisors(req, res) {
    try {
      const supervisors = await prisma.user.findMany({
        where: { role: 'supervisor' },
        include: { clinic: true },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = supervisors.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        clinicId: s.clinicId,
        clinicName: s.clinic?.name || 'Unassigned',
        isActive: s.isActive,
        createdAt: s.createdAt,
      }));

      return res.json({ success: true, data: formatted });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch supervisors.' });
    }
  }

  async createSupervisor(req, res) {
    try {
      const { name, email, password, clinicId } = req.body;

      if (!name || !email || !password || !clinicId) {
        return res.status(400).json({
          success: false,
          message: 'name, email, password, and clinicId are required.',
        });
      }

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic) {
        return res.status(404).json({ success: false, message: 'Clinic not found.' });
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const supervisor = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'supervisor',
          clinicId,
          isActive: true,
        },
        include: { clinic: true },
      });

      return res.status(201).json({
        success: true,
        message: 'Supervisor account provisioned successfully.',
        data: {
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email,
          role: supervisor.role,
          clinicId: supervisor.clinicId,
          clinicName: supervisor.clinic.name,
        },
      });
    } catch (err) {
      console.error('Error creating supervisor:', err);
      return res.status(500).json({ success: false, message: 'Failed to create supervisor.' });
    }
  }

  async toggleSupervisorActive(req, res) {
    try {
      const userId = req.params.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
      });

      return res.json({ success: true, data: { id: updated.id, isActive: updated.isActive } });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to toggle supervisor.' });
    }
  }

  // --- Cross-Clinic Overview Analytics ---
  async getSystemAnalytics(req, res) {
    try {
      const [totalClinics, totalDoctors, totalSupervisors, totalTokens, activeSessions] = await Promise.all([
        prisma.clinic.count(),
        prisma.doctor.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'supervisor', isActive: true } }),
        prisma.token.count(),
        prisma.session.count({ where: { endedAt: null } }),
      ]);

      const tokensByStatus = await prisma.token.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const statusMap = {
        waiting: 0,
        in_consultation: 0,
        completed: 0,
        no_show: 0,
        carried_over: 0,
      };

      tokensByStatus.forEach((g) => {
        statusMap[g.status] = g._count.id;
      });

      return res.json({
        success: true,
        data: {
          overview: {
            totalClinics,
            totalDoctors,
            totalSupervisors,
            totalTokens,
            activeSessions,
          },
          statusBreakdown: statusMap,
        },
      });
    } catch (err) {
      console.error('System analytics error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve system analytics.' });
    }
  }
}

module.exports = new AdminController();
