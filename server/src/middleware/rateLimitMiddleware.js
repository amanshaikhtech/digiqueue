const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for token issuance (public endpoint)
 * 30 requests per minute per IP
 */
const issueTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many token requests from this IP. Please wait a moment before trying again.',
  },
});

/**
 * Rate limiter for token status check (public endpoint)
 * 60 requests per minute per IP
 */
const statusCheckLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many status inquiries. Real-time updates are pushed via WebSocket automatically.',
  },
});

module.exports = {
  issueTokenLimiter,
  statusCheckLimiter,
};
