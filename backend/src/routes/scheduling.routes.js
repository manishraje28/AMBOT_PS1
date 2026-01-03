const express = require('express');
const router = express.Router();
const schedulingService = require('../services/scheduling.service');
const { authenticate, studentOnly, alumniOnly } = require('../middleware/auth.middleware');
const { validateBooking, validatePagination } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { ROLES } = require('../config/constants');

// GET /api/scheduling/slots/:alumniId - Get available slots for an alumni
router.get('/slots/:alumniId', authenticate, studentOnly, asyncHandler(async (req, res) => {
  const { alumniId } = req.params;
  const { startDate, endDate } = req.query;

  // Default to next 14 days if not specified
  const start = startDate || new Date().toISOString();
  const end = endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const result = await schedulingService.getAvailableSlots(alumniId, {
    startDate: start,
    endDate: end
  });

  res.json({
    success: true,
    data: result
  });
}));

// POST /api/scheduling/book - Book a mentorship session
router.post('/book', authenticate, studentOnly, validateBooking, asyncHandler(async (req, res) => {
  const { alumniId, slotTime, notes } = req.body;

  const result = await schedulingService.bookSession(req.user.id, alumniId, {
    slotTime,
    notes
  });

  res.status(201).json({
    success: true,
    message: 'Mentorship session booked successfully',
    data: result
  });
}));

// GET /api/scheduling/sessions - Get user's sessions
router.get('/sessions', authenticate, validatePagination, asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;

  let sessions;

  if (req.user.role === ROLES.STUDENT) {
    sessions = await schedulingService.getStudentSessions(req.user.id, {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
  } else if (req.user.role === ROLES.ALUMNI) {
    sessions = await schedulingService.getAlumniSessions(req.user.id, {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
  }

  res.json({
    success: true,
    data: sessions
  });
}));

// POST /api/scheduling/sessions/:id/cancel - Cancel a session
router.post('/sessions/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  await schedulingService.cancelSession(id, req.user.id, reason);

  res.json({
    success: true,
    message: 'Session cancelled successfully'
  });
}));

// POST /api/scheduling/sessions/:id/complete - Complete a session (alumni only)
router.post('/sessions/:id/complete', authenticate, alumniOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  await schedulingService.completeSession(id, req.user.id, { notes });

  res.json({
    success: true,
    message: 'Session marked as completed'
  });
}));

// POST /api/scheduling/sessions/:id/feedback - Add feedback (student only)
router.post('/sessions/:id/feedback', authenticate, studentOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Rating must be between 1 and 5'
    });
  }

  await schedulingService.addStudentFeedback(id, req.user.id, { rating, feedback });

  res.json({
    success: true,
    message: 'Feedback submitted successfully'
  });
}));

module.exports = router;
