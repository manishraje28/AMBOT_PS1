const { body, param, query, validationResult } = require('express-validator');
const { ROLES, OPPORTUNITY_TYPES } = require('../config/constants');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be 2-100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be 2-100 characters'),
  body('role')
    .isIn([ROLES.STUDENT, ROLES.ALUMNI])
    .withMessage('Role must be student or alumni'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Student profile validation
const validateStudentProfile = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('domains')
    .optional()
    .isArray()
    .withMessage('Domains must be an array'),
  body('interests')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Interests must be a string under 1000 characters'),
  body('careerGoals')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Career goals must be a string under 1000 characters'),
  body('graduationYear')
    .optional()
    .isInt({ min: 1990, max: 2035 })
    .withMessage('Invalid graduation year'),
  handleValidationErrors
];

// Alumni profile validation
const validateAlumniProfile = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('domains')
    .optional()
    .isArray()
    .withMessage('Domains must be an array'),
  body('company')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Company name must be under 255 characters'),
  body('jobTitle')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Job title must be under 255 characters'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience years must be between 0 and 50'),
  body('calcomEventTypeId')
    .optional()
    .isString()
    .withMessage('Cal.com Event Type ID must be a string'),
  handleValidationErrors
];

// Opportunity validation
const validateOpportunity = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be 5-255 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be 20-5000 characters'),
  body('type')
    .isIn(Object.values(OPPORTUNITY_TYPES))
    .withMessage(`Type must be one of: ${Object.values(OPPORTUNITY_TYPES).join(', ')}`),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('requiredDomains')
    .optional()
    .isArray()
    .withMessage('Required domains must be an array'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  handleValidationErrors
];

// Booking validation
const validateBooking = [
  body('alumniId')
    .isUUID()
    .withMessage('Valid alumni ID is required'),
  body('slotTime')
    .isISO8601()
    .withMessage('Valid slot time is required'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes must be under 500 characters'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateStudentProfile,
  validateAlumniProfile,
  validateOpportunity,
  validateBooking,
  validateUUID,
  validatePagination
};
