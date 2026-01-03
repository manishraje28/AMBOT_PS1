// User roles
const ROLES = {
  STUDENT: 'student',
  ALUMNI: 'alumni',
  ADMIN: 'admin' // Prepared for future extensibility
};

// Opportunity types
const OPPORTUNITY_TYPES = {
  INTERNSHIP: 'internship',
  PROJECT: 'project',
  REFERRAL: 'referral',
  MENTORSHIP: 'mentorship',
  JOB: 'job'
};

// Booking statuses
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
};

// Matchmaking scoring weights
const MATCHING_WEIGHTS = {
  DOMAIN_MATCH: 3,
  SKILL_OVERLAP: 2,
  CAREER_GOAL_ALIGNMENT: 1
};

// Default pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  MATCHMAKING: 300, // 5 minutes
  ALUMNI_LIST: 600, // 10 minutes
  OPPORTUNITIES: 180 // 3 minutes
};

module.exports = {
  ROLES,
  OPPORTUNITY_TYPES,
  BOOKING_STATUS,
  MATCHING_WEIGHTS,
  PAGINATION,
  CACHE_TTL
};
