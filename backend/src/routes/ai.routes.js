const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const profileService = require('../services/profile.service');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { ROLES } = require('../config/constants');

// GET /api/ai/status - Check if AI is available
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      available: aiService.isAvailable(),
      model: 'gemini-2.0-flash'
    }
  });
}));

// POST /api/ai/chat - Direct chat with AI
router.post('/chat', authenticate, asyncHandler(async (req, res) => {
  const { message, chatHistory = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  // Get user context for personalized responses
  let userContext = {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role
  };

  try {
    // Get full profile for more context
    if (req.user.role === ROLES.STUDENT) {
      const profile = await profileService.getStudentProfile(req.user.id);
      userContext = { ...userContext, ...profile };
    } else if (req.user.role === ROLES.ALUMNI) {
      const profile = await profileService.getAlumniProfile(req.user.id);
      userContext = { ...userContext, ...profile };
    }
  } catch (error) {
    // Continue with basic context if profile fetch fails
    console.warn('Could not fetch full profile for AI context:', error.message);
  }

  const result = await aiService.chat(message, userContext, chatHistory);

  res.json({
    success: true,
    data: {
      response: result.response,
      model: result.model
    }
  });
}));

// POST /api/ai/mention - Handle @AI mentions in conversations
router.post('/mention', authenticate, asyncHandler(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  // Extract the AI query
  const { hasAIMention, query } = aiService.extractAIQuery(message);

  if (!hasAIMention) {
    return res.status(400).json({
      success: false,
      error: 'No @AI mention found in message'
    });
  }

  if (!query) {
    return res.json({
      success: true,
      data: {
        response: "Hi! I'm AMBOT AI. How can I help you today? Just ask me anything about careers, mentorship, skills, or professional development!",
        model: 'gemini-2.0-flash'
      }
    });
  }

  // Get user context
  let userContext = {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role
  };

  try {
    if (req.user.role === ROLES.STUDENT) {
      const profile = await profileService.getStudentProfile(req.user.id);
      userContext = { ...userContext, ...profile };
    } else if (req.user.role === ROLES.ALUMNI) {
      const profile = await profileService.getAlumniProfile(req.user.id);
      userContext = { ...userContext, ...profile };
    }
  } catch (error) {
    console.warn('Could not fetch full profile for AI context:', error.message);
  }

  const result = await aiService.generateResponse(query, userContext, conversationHistory);

  res.json({
    success: true,
    data: {
      response: result.response,
      model: result.model,
      query: query
    }
  });
}));

// POST /api/ai/suggest-message - Get AI suggestions for messages
router.post('/suggest-message', authenticate, asyncHandler(async (req, res) => {
  const { context, type = 'general' } = req.body;

  if (!context) {
    return res.status(400).json({
      success: false,
      error: 'Context is required'
    });
  }

  let prompt = '';
  
  switch (type) {
    case 'introduction':
      prompt = `Help me write a professional introduction message to connect with a mentor. Context: ${context}`;
      break;
    case 'follow-up':
      prompt = `Help me write a follow-up message after a mentorship session. Context: ${context}`;
      break;
    case 'thank-you':
      prompt = `Help me write a thank you message to my mentor. Context: ${context}`;
      break;
    case 'application':
      prompt = `Help me write a compelling application message for an opportunity. Context: ${context}`;
      break;
    default:
      prompt = `Help me compose a professional message. Context: ${context}`;
  }

  const userContext = {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role
  };

  const result = await aiService.generateResponse(prompt, userContext);

  res.json({
    success: true,
    data: {
      suggestion: result.response,
      type: type
    }
  });
}));

module.exports = router;
