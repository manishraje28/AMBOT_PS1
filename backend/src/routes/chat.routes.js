const express = require('express');
const router = express.Router();
const chatService = require('../services/chat.service');
const { authenticate } = require('../middleware/auth.middleware');

// Get all conversations for the current user
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const conversations = await chatService.getUserConversations(req.user.id);
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

// Get or create a conversation with another user
router.post('/conversations', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    const conversation = await chatService.getOrCreateConversation(req.user.id, userId);
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, before } = req.query;

    const messages = await chatService.getMessages(
      id,
      req.user.id,
      parseInt(limit) || 50,
      before || null
    );

    res.json({ messages });
  } catch (error) {
    if (error.message === 'Access denied to this conversation') {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// Send a message
router.post('/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await chatService.sendMessage(id, req.user.id, content.trim());
    
    // Emit to all participants in the conversation via WebSocket
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    if (io) {
      // Emit to the conversation room (for users viewing the conversation)
      io.to(`conversation:${id}`).emit('new_message', message);
      
      // Also get recipient and emit notification if they're not in the conversation room
      const recipientId = await chatService.getRecipientId(id, req.user.id);
      if (recipientId && connectedUsers.has(recipientId)) {
        io.to(`user:${recipientId}`).emit('message_notification', {
          conversationId: id,
          message
        });
      }
    }
    
    res.json({ message });
  } catch (error) {
    if (error.message === 'Access denied to this conversation') {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// Mark messages as read
router.post('/conversations/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    await chatService.markAsRead(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get unread message count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await chatService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
