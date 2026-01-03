const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const { authenticate } = require('../middleware/auth.middleware');

// Get notifications for current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { limit, offset, unreadOnly } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      req.user.id,
      parseInt(limit) || 20,
      parseInt(offset) || 0,
      unreadOnly === 'true'
    );

    const unreadCount = await notificationService.getUnreadCount(req.user.id);

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// Get unread count only
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Mark a notification as read
router.post('/:id/read', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete a notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await notificationService.delete(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
