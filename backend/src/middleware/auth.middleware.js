const authService = require('../services/auth.service');
const { ROLES } = require('../config/constants');

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing'
      });
    }

    const decoded = authService.verifyToken(token);
    
    // Get fresh user data
    const user = await authService.getUserById(decoded.userId);
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token'
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. This action requires ${allowedRoles.join(' or ')} role.`
      });
    }

    next();
  };
};

// Student-only middleware
const studentOnly = authorize(ROLES.STUDENT);

// Alumni-only middleware
const alumniOnly = authorize(ROLES.ALUMNI);

// Admin-only middleware (for future extensibility)
const adminOnly = authorize(ROLES.ADMIN);

// Student or Alumni middleware
const authenticatedUser = authorize(ROLES.STUDENT, ROLES.ALUMNI, ROLES.ADMIN);

module.exports = {
  authenticate,
  authorize,
  studentOnly,
  alumniOnly,
  adminOnly,
  authenticatedUser
};
