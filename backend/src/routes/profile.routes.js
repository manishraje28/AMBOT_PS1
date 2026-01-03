const express = require('express');
const router = express.Router();
const profileService = require('../services/profile.service');
const { authenticate, studentOnly, alumniOnly } = require('../middleware/auth.middleware');
const { validateStudentProfile, validateAlumniProfile, validatePagination } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { ROLES } = require('../config/constants');

// GET /api/profile - Get current user's profile
router.get('/', authenticate, asyncHandler(async (req, res) => {
  let profile;

  if (req.user.role === ROLES.STUDENT) {
    profile = await profileService.getStudentProfile(req.user.id);
  } else if (req.user.role === ROLES.ALUMNI) {
    profile = await profileService.getAlumniProfile(req.user.id);
  } else {
    return res.status(400).json({
      success: false,
      error: 'Invalid user role'
    });
  }

  res.json({
    success: true,
    data: {
      ...profile,
      role: req.user.role
    }
  });
}));

// PUT /api/profile - Update current user's profile
router.put('/', authenticate, asyncHandler(async (req, res) => {
  let profile;

  if (req.user.role === ROLES.STUDENT) {
    profile = await profileService.updateStudentProfile(req.user.id, req.body);
  } else if (req.user.role === ROLES.ALUMNI) {
    profile = await profileService.updateAlumniProfile(req.user.id, req.body);
  } else {
    return res.status(400).json({
      success: false,
      error: 'Invalid user role'
    });
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      ...profile,
      role: req.user.role
    }
  });
}));

// GET /api/profile/student/:id - Get student profile by ID (alumni can view)
router.get('/student/:id', authenticate, asyncHandler(async (req, res) => {
  const profile = await profileService.getStudentProfile(req.params.id);

  res.json({
    success: true,
    data: profile
  });
}));

// GET /api/profile/alumni - List all alumni (for students)
router.get('/alumni', authenticate, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, availableOnly } = req.query;

  const result = await profileService.getAllAlumni({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    availableOnly: availableOnly === 'true'
  });

  res.json({
    success: true,
    data: result.alumni,
    pagination: result.pagination
  });
}));

// GET /api/profile/alumni/:id - Get alumni profile by ID
router.get('/alumni/:id', authenticate, asyncHandler(async (req, res) => {
  const profile = await profileService.getAlumniById(req.params.id);

  res.json({
    success: true,
    data: profile
  });
}));

module.exports = router;
