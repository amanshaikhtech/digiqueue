const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { requireAuth, requireRole, requireDoctorClinicScope } = require('../middleware/authMiddleware');

// Public: get doctors list for clinic check-in selection
router.get('/clinic/:clinicId', doctorController.getDoctorsByClinic);

// Public / Reception: get QR code for doctor check-in desk
router.get('/:id/qr', doctorController.getDoctorQR);

// Authenticated: get current session & queue breakdown for doctor
router.get(
  '/:id/current-session',
  requireAuth,
  requireRole('admin', 'supervisor'),
  requireDoctorClinicScope,
  doctorController.getCurrentSession
);

// Authenticated: reset session (close old session, mark waiting as carried-over, start new session at 1, broadcast)
router.post(
  '/:id/reset-session',
  requireAuth,
  requireRole('admin', 'supervisor'),
  requireDoctorClinicScope,
  doctorController.resetSession
);

// Authenticated: call next token in queue
router.patch(
  '/:id/next',
  requireAuth,
  requireRole('admin', 'supervisor'),
  requireDoctorClinicScope,
  doctorController.callNext
);

router.patch(
  '/:id/complete-current',
  requireAuth,
  requireRole('admin', 'supervisor'),
  requireDoctorClinicScope,
  doctorController.completeCurrent
);

// Authenticated: get wait-time and queue analytics for doctor
router.get(
  '/:id/analytics',
  requireAuth,
  requireRole('admin', 'supervisor'),
  requireDoctorClinicScope,
  doctorController.getDoctorAnalytics
);

module.exports = router;
