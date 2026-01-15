require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const matchmakingRoutes = require('./routes/matchmaking.routes');
const schedulingRoutes = require('./routes/scheduling.routes');
const opportunityRoutes = require('./routes/opportunity.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');
const aiRoutes = require('./routes/ai.routes');
const path = require('path');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { initializeDatabase } = require('./db/init');
const chatService = require('./services/chat.service');
const notificationService = require('./services/notification.service');

const app = express();
const server = http.createServer(app);

// Ensure uploads directories exist so static serving works even before any upload
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const resumesDir = path.join(uploadsDir, 'resumes');
const fs = require('fs');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });
  console.log('✅ Upload directories verified');
} catch (err) {
  console.error('❌ Failed to ensure upload directories:', err);
}

// Socket.IO setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`📱 User ${userId} connected via WebSocket`);
  
  // Track connected user
  connectedUsers.set(userId, socket.id);
  
  // Join user's personal room for notifications
  socket.join(`user:${userId}`);

  // Handle joining a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });

  // Handle leaving a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Handle sending a message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content } = data;
      
      // Save message to database
      const message = await chatService.sendMessage(conversationId, userId, content);
      
      // Get recipient ID
      const recipientId = await chatService.getRecipientId(conversationId, userId);
      
      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('new_message', message);
      
      // Emit notification to recipient if they're not in the conversation
      const recipientSocketId = connectedUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(`user:${recipientId}`).emit('message_notification', {
          conversationId,
          message
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing_start', (conversationId) => {
    socket.to(`conversation:${conversationId}`).emit('user_typing', { userId });
  });

  socket.on('typing_stop', (conversationId) => {
    socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { userId });
  });

  // Handle marking messages as read
  socket.on('mark_read', async (conversationId) => {
    try {
      await chatService.markAsRead(conversationId, userId);
      socket.to(`conversation:${conversationId}`).emit('messages_read', { userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`📴 User ${userId} disconnected`);
    connectedUsers.delete(userId);
  });
});

// Export io for use in other modules
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Security middleware - configure helmet to allow cross-origin images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for REST API
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically with proper headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 AlumNet Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket server ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, server };
