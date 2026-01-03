// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token has expired'
    });
  }

  // Database constraint errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with this data already exists'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist'
    });
  }

  // Custom operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.message
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'An unexpected error occurred. Please try again later.'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

// Async handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom operational error class
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};
