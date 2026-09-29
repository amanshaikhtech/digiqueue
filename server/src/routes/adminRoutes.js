const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// Clinics
router.get('/clinics', adminController.getClinics);
router.post('/clinics', adminController.createClinic);

// Doctors
router.get('/doctors', adminController.getDoctors);
router.post('/doctors', adminController.createDoctor);
router.patch('/doctors/:id/toggle', adminController.toggleDoctorActive);

// Supervisors
router.get('/supervisors', adminController.getSupervisors);
router.post('/supervisors', adminController.createSupervisor);
router.patch('/supervisors/:id/toggle', adminController.toggleSupervisorActive);

// Analytics
router.get('/analytics', adminController.getSystemAnalytics);

module.exports = router;
