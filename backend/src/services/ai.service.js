const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isConfigured = false;
    
    this.initializeAI();
  }

  initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not configured - AI features will not work');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      this.isConfigured = true;
      console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
    }
  }

  // Clean response text - remove all markdown formatting
  cleanResponse(text) {
    return text
      .replace(/\*\*/g, '')           // Remove bold **
      .replace(/\*/g, '')             // Remove italic *
      .replace(/#{1,6}\s/g, '')       // Remove headers #
      .replace(/`{1,3}/g, '')         // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links, keep text
      .replace(/^\s*[-*+]\s*/gm, '- ') // Normalize bullets to dash
      .replace(/^\s*\d+\.\s*/gm, '- ') // Convert numbered lists to dash
      .trim();
  }

  // System prompt for the AI assistant
  getSystemPrompt(userContext = {}) {
    return `You are AMBOT AI, a concise assistant for the AMBOT mentorship platform.

User: ${userContext.firstName || 'User'} (${userContext.role || 'user'})

CRITICAL OUTPUT RULES - FOLLOW EXACTLY:
1. NEVER use asterisks, markdown, bold, italics, hashtags, or any formatting symbols
2. Keep total response under 100 words
3. Maximum 3-4 short bullet points using only the dash character
4. Each bullet point must be one short sentence only
5. No introductions, no conclusions, no filler text
6. Go straight to the answer

Example of correct format:
- First point here in one sentence
- Second point here in one sentence
- Third point here in one sentence

NEVER write like this: **bold** or *italic* or # headers`;
  }

  // Extract @AI query from a message
  extractAIQuery(message) {
    // Check if message contains @AI mention
    const aiMentionPattern = /@AI\s*(.*)/i;
    const match = message.match(aiMentionPattern);
    
    if (match) {
      return {
        hasAIMention: true,
        query: match[1].trim() || message.replace(/@AI/gi, '').trim()
      };
    }
    
    return {
      hasAIMention: false,
      query: null
    };
  }

  // Generate AI response
  async generateResponse(query, userContext = {}, conversationHistory = []) {
    if (!this.isConfigured) {
      throw new Error('AI service is not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    try {
      const systemPrompt = this.getSystemPrompt(userContext);
      
      // Build conversation context
      let contextMessages = '';
      if (conversationHistory.length > 0) {
        contextMessages = '\n\nRecent conversation context:\n' + 
          conversationHistory.slice(-5).map(msg => 
            `${msg.senderName}: ${msg.content}`
          ).join('\n');
      }

      const fullPrompt = `${systemPrompt}${contextMessages}\n\nUser's question: ${query}\n\nPlease provide a helpful response:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = this.cleanResponse(response.text());

      return {
        success: true,
        response: text,
        model: 'gemini-2.0-flash'
      };
    } catch (error) {
      console.error('AI Generation Error:', error);
      
      // Handle specific error types
      if (error.message?.includes('API_KEY')) {
        throw new Error('Invalid API key. Please check your Gemini API configuration.');
      }
      if (error.message?.includes('SAFETY')) {
        return {
          success: true,
          response: "I apologize, but I can't provide a response to that query. Please try rephrasing your question or ask something else.",
          model: 'gemini-2.0-flash'
        };
      }
      
      throw new Error('Failed to generate AI response. Please try again later.');
    }
  }

  // Direct chat with AI (for AI conversation)
  async chat(message, userContext = {}, chatHistory = []) {
    if (!this.isConfigured) {
      throw new Error('AI service is not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    try {
      const systemPrompt = this.getSystemPrompt(userContext);
      
      // Build chat history for context
      const historyContext = chatHistory.slice(-10).map(msg => ({
        role: msg.isAI ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Start chat with history
      const chat = this.model.startChat({
        history: historyContext,
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.5,
        },
      });

      // Add system context to the message
      const contextualMessage = chatHistory.length === 0 
        ? `${systemPrompt}\n\nUser: ${message}`
        : message;

      const result = await chat.sendMessage(contextualMessage);
      const response = await result.response;
      const text = this.cleanResponse(response.text());

      return {
        success: true,
        response: text,
        model: 'gemini-2.0-flash'
      };
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  // Check if AI is available
  isAvailable() {
    return this.isConfigured;
  }
}

module.exports = new AIService();
