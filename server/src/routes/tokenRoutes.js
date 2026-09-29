const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { requireAuth, requireRole, requireTokenClinicScope } = require('../middleware/authMiddleware');
const { issueTokenLimiter, statusCheckLimiter } = require('../middleware/rateLimitMiddleware');

// POST /api/tokens/issue (public, unauthenticated, rate-limited)
router.post('/issue', issueTokenLimiter, tokenController.issue);

// GET /api/tokens/:id/status (public, rate-limited)
router.get('/:id/status', statusCheckLimiter, tokenController.getStatus);

// PATCH /api/tokens/:id/no-show (requires supervisor or admin, clinic-scoped)
router.patch(
  '/:id/no-show',
  requireAuth,
  requireRole('admin', 'supervisor'),
  requireTokenClinicScope,
  tokenController.markNoShow
);

module.exports = router;
