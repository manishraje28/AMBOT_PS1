const express = require('express');
const router = express.Router();
const matchmakingService = require('../services/matchmaking.service');
const { authenticate, studentOnly } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

// GET /api/matchmaking/matches - Get matched alumni for current student
router.get('/matches', authenticate, studentOnly, asyncHandler(async (req, res) => {
  const { limit, refresh } = req.query;

  const matches = await matchmakingService.getMatches(req.user.id, {
    limit: parseInt(limit) || 5,
    forceRefresh: refresh === 'true'
  });

  res.json({
    success: true,
    data: {
      matches,
      count: matches.length,
      refreshedAt: new Date().toISOString()
    }
  });
}));

// POST /api/matchmaking/refresh - Force refresh matches
router.post('/refresh', authenticate, studentOnly, asyncHandler(async (req, res) => {
  const { limit } = req.body;

  // Invalidate cache
  matchmakingService.invalidateCache(req.user.id);

  // Get fresh matches
  const matches = await matchmakingService.getMatches(req.user.id, {
    limit: parseInt(limit) || 5,
    forceRefresh: true
  });

  res.json({
    success: true,
    message: 'Matches refreshed successfully',
    data: {
      matches,
      count: matches.length,
      refreshedAt: new Date().toISOString()
    }
  });
}));

module.exports = router;
