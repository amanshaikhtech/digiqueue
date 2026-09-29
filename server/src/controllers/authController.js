const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

class AuthController {
  /**
   * User login (admin or supervisor)
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { clinic: true },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Contact hospital admin.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const secret = process.env.JWT_SECRET || 'digiqueue_super_secret_jwt_key_2026_pediatric_hospital';
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
        },
        secret,
        { expiresIn: '30m' } // short-lived 30 minutes
      );

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: user.clinicId,
          clinic: user.clinic,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  }

  /**
   * Returns current authenticated user
   */
  async getMe(req, res) {
    return res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        clinicId: req.user.clinicId,
        clinic: req.user.clinic,
      },
    });
  }
}

module.exports = new AuthController();
