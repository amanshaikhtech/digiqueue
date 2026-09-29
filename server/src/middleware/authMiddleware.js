const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Middleware to verify JWT and authenticate user
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'digiqueue_super_secret_jwt_key_2026_pediatric_hospital';
    const decoded = jwt.verify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { clinic: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

/**
 * Middleware to restrict access based on roles
 * @param  {...string} roles - 'admin', 'supervisor'
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Action requires role: [${roles.join(', ')}].`,
      });
    }

    next();
  };
}

/**
 * Ensures supervisor only acts on resources within their assigned clinic.
 * System admins bypass this restriction.
 */
async function requireDoctorClinicScope(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return next(); // Admins have global access
    }

    // Identify doctor ID from params or body
    const doctorId = req.params.id || req.params.doctorId || req.body.doctorId;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required for clinic verification.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { clinicId: true },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    if (doctor.clinicId !== req.user.clinicId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have supervisor authority over this clinic or doctor.',
      });
    }

    req.targetDoctorClinicId = doctor.clinicId;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking clinic scope authorization.' });
  }
}

/**
 * Ensures supervisor only acts on tokens within their assigned clinic
 */
async function requireTokenClinicScope(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    const tokenId = req.params.id || req.body.tokenId;
    if (!tokenId) {
      return res.status(400).json({ success: false, message: 'Token ID is required for clinic verification.' });
    }

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        doctor: { select: { clinicId: true } },
      },
    });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    if (token.doctor.clinicId !== req.user.clinicId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have supervisor authority over this clinic token.',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking clinic scope for token.' });
  }
}

module.exports = {
  requireAuth,
  requireRole,
  requireDoctorClinicScope,
  requireTokenClinicScope,
};
