const tokenService = require('../services/tokenService');

class TokenController {
  /**
   * POST /api/tokens/issue
   * Public, rate-limited, atomic row locking on active session
   */
  async issue(req, res) {
    try {
      const { patientName, patientAge, guardianName, guardianPhone, doctorId } = req.body;

      if (!patientName || !guardianName || !guardianPhone || !doctorId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: patientName, guardianName, guardianPhone, doctorId are required.',
        });
      }

      if (typeof guardianPhone !== 'string' || !/^\d{10}$/.test(guardianPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Guardian mobile number must contain exactly 10 digits.',
        });
      }

      const result = await tokenService.issueToken({
        patientName: patientName.trim(),
        patientAge: patientAge === undefined || patientAge === '' ? null : Number(patientAge),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        doctorId,
      });

      return res.status(201).json({
        success: true,
        message: 'Token generated successfully.',
        data: result,
      });
    } catch (err) {
      console.error('Token issuance error:', err);
      if (err.code === 'DOCTOR_UNAVAILABLE') {
        return res.status(400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      if (err.code === 'NO_ACTIVE_SESSION' || err.statusCode === 400) {
        return res.status(400).json({
          success: false,
          code: 'NO_ACTIVE_SESSION',
          message: err.message || 'Clinic session is currently closed. No doctor is actively accepting patients.',
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to issue token. Please try again.',
      });
    }
  }

  /**
   * GET /api/tokens/:id/status
   * Public, rate-limited
   */
  async getStatus(req, res) {
    try {
      const tokenId = req.params.id;
      const statusData = await tokenService.getTokenStatus(tokenId);

      return res.json({
        success: true,
        data: statusData,
      });
    } catch (err) {
      if (err.statusCode === 404) {
        return res.status(404).json({ success: false, message: 'Token not found.' });
      }
      return res.status(500).json({ success: false, message: 'Error retrieving token status.' });
    }
  }

  /**
   * PATCH /api/tokens/:id/no-show
   * Requires supervisor or admin, clinic-scoped
   */
  async markNoShow(req, res) {
    try {
      const tokenId = req.params.id;
      const updatedToken = await tokenService.markNoShow(tokenId, req.user.id);

      return res.json({
        success: true,
        message: 'Token marked as no-show.',
        data: updatedToken,
      });
    } catch (err) {
      if (err.statusCode === 404) {
        return res.status(404).json({ success: false, message: 'Token not found.' });
      }
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: 'Failed to mark token as no-show.' });
    }
  }
}

module.exports = new TokenController();
