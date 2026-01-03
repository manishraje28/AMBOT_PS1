const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const { validateRegistration, validateLogin } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

// POST /api/auth/register
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  const { email, password, role, firstName, lastName } = req.body;

  const result = await authService.register({
    email,
    password,
    role,
    firstName,
    lastName
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result
  });
}));

// POST /api/auth/login
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.json({
    success: true,
    message: 'Login successful',
    data: result
  });
}));

// GET /api/auth/me - Get current user
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    }
  });
}));

// POST /api/auth/change-password
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters'
    });
  }

  await authService.changePassword(req.user.id, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// POST /api/auth/verify-token
router.post('/verify-token', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user
    }
  });
}));

module.exports = router;
