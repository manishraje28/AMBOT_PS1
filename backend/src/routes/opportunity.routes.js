const express = require('express');
const router = express.Router();
const opportunityService = require('../services/opportunity.service');
const { authenticate, studentOnly, alumniOnly } = require('../middleware/auth.middleware');
const { validateOpportunity, validatePagination } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { ROLES } = require('../config/constants');

// GET /api/opportunities - Get opportunities list
router.get('/', authenticate, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, type, domains, skills, isRemote } = req.query;

  const result = await opportunityService.getOpportunities({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    type,
    domains: domains ? domains.split(',') : undefined,
    skills: skills ? skills.split(',') : undefined,
    isRemote: isRemote === 'true' ? true : isRemote === 'false' ? false : undefined,
    studentId: req.user.role === ROLES.STUDENT ? req.user.id : undefined
  });

  res.json({
    success: true,
    data: result.opportunities,
    pagination: result.pagination
  });
}));

// GET /api/opportunities/my - Get current alumni's opportunities
router.get('/my', authenticate, alumniOnly, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await opportunityService.getAlumniOpportunities(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10
  });

  res.json({
    success: true,
    data: result.opportunities,
    pagination: result.pagination
  });
}));

// GET /api/opportunities/applications - Get student's applications
router.get('/applications', authenticate, studentOnly, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const applications = await opportunityService.getStudentApplications(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10
  });

  res.json({
    success: true,
    data: applications
  });
}));

// GET /api/opportunities/:id - Get single opportunity
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.getOpportunityById(req.params.id);

  res.json({
    success: true,
    data: opportunity
  });
}));

// POST /api/opportunities - Create opportunity (alumni only)
router.post('/', authenticate, alumniOnly, validateOpportunity, asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.createOpportunity(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Opportunity created successfully',
    data: opportunity
  });
}));

// PUT /api/opportunities/:id - Update opportunity (alumni only)
router.put('/:id', authenticate, alumniOnly, asyncHandler(async (req, res) => {
  const opportunity = await opportunityService.updateOpportunity(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json({
    success: true,
    message: 'Opportunity updated successfully',
    data: opportunity
  });
}));

// DELETE /api/opportunities/:id - Delete opportunity (alumni only)
router.delete('/:id', authenticate, alumniOnly, asyncHandler(async (req, res) => {
  await opportunityService.deleteOpportunity(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Opportunity deleted successfully'
  });
}));

// POST /api/opportunities/:id/apply - Apply for opportunity (student only)
router.post('/:id/apply', authenticate, studentOnly, asyncHandler(async (req, res) => {
  const { coverNote, resumeUrl } = req.body;

  const application = await opportunityService.applyForOpportunity(
    req.params.id,
    req.user.id,
    { coverNote, resumeUrl },
    req.app
  );

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: application
  });
}));

// GET /api/opportunities/:id/applications - Get applications for an opportunity (alumni only)
router.get('/:id/applications', authenticate, alumniOnly, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  
  console.log('Getting applications for opportunity:', req.params.id, 'by user:', req.user.id);

  const result = await opportunityService.getOpportunityApplications(
    req.params.id,
    req.user.id,
    { page: parseInt(page) || 1, limit: parseInt(limit) || 10 }
  );
  
  console.log('Found applications:', result.applications?.length || 0);

  res.json({
    success: true,
    data: result.applications,
    pagination: result.pagination
  });
}));

// PUT /api/opportunities/applications/:applicationId/status - Update application status (alumni only)
router.put('/applications/:applicationId/status', authenticate, alumniOnly, asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  const result = await opportunityService.updateApplicationStatus(
    req.params.applicationId,
    req.user.id,
    status,
    req.app
  );

  res.json({
    success: true,
    message: 'Application status updated successfully',
    data: result
  });
}));

// DELETE /api/opportunities/applications/:applicationId - Withdraw application (student only)
router.delete('/applications/:applicationId', authenticate, studentOnly, asyncHandler(async (req, res) => {
  const result = await opportunityService.withdrawApplication(
    req.params.applicationId,
    req.user.id
  );

  res.json({
    success: true,
    message: 'Application withdrawn successfully',
    data: result
  });
}));

module.exports = router;
