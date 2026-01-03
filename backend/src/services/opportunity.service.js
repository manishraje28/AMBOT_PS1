const { query } = require('../config/database');
const { OPPORTUNITY_TYPES, ROLES, PAGINATION } = require('../config/constants');
const notificationService = require('./notification.service');
const resumeService = require('./resume.service');

class OpportunityService {
  // Create opportunity (alumni only)
  async createOpportunity(alumniId, data) {
    const {
      title, description, type, company, location,
      isRemote, requiredSkills, requiredDomains,
      deadline, externalLink
    } = data;

    // Validate type
    if (!Object.values(OPPORTUNITY_TYPES).includes(type)) {
      throw new Error(`Invalid opportunity type. Must be one of: ${Object.values(OPPORTUNITY_TYPES).join(', ')}`);
    }

    const result = await query(
      `INSERT INTO opportunities (
        alumni_id, title, description, type, company, location,
        is_remote, required_skills, required_domains, deadline, external_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        alumniId, title, description, type, company || null, location || null,
        isRemote || false, requiredSkills || [], requiredDomains || [],
        deadline || null, externalLink || null
      ]
    );

    return this.formatOpportunity(result.rows[0]);
  }

  // Get opportunities with filtering and sorting
  async getOpportunities({ 
    page = 1, 
    limit = 10, 
    type, 
    domains, 
    skills,
    isRemote,
    studentId 
  }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE o.is_active = true';
    const params = [];
    let paramCount = 1;

    // Filter by type
    if (type) {
      whereClause += ` AND o.type = $${paramCount++}`;
      params.push(type);
    }

    // Filter by remote
    if (isRemote !== undefined) {
      whereClause += ` AND o.is_remote = $${paramCount++}`;
      params.push(isRemote);
    }

    // Check deadline hasn't passed
    whereClause += ` AND (o.deadline IS NULL OR o.deadline >= CURRENT_DATE)`;

    // Build relevance scoring for personalization
    let orderByClause = 'ORDER BY o.created_at DESC';
    let relevanceSelect = '';

    if (studentId) {
      // Get student's profile for personalization
      const studentResult = await query(
        `SELECT skills, domains FROM student_profiles WHERE user_id = $1`,
        [studentId]
      );

      if (studentResult.rows.length > 0) {
        const studentSkills = studentResult.rows[0].skills || [];
        const studentDomains = studentResult.rows[0].domains || [];

        // Add relevance scoring
        relevanceSelect = `,
          (SELECT COUNT(*) FROM unnest(o.required_domains) d WHERE d = ANY($${paramCount})) * 3 +
          (SELECT COUNT(*) FROM unnest(o.required_skills) s WHERE s = ANY($${paramCount + 1})) * 2
          AS relevance_score`;
        
        params.push(studentDomains, studentSkills);
        paramCount += 2;

        orderByClause = 'ORDER BY relevance_score DESC, o.created_at DESC';
      }
    }

    const result = await query(
      `SELECT 
        o.*,
        u.first_name as alumni_first_name,
        u.last_name as alumni_last_name,
        u.avatar_url as alumni_avatar,
        ap.company as alumni_company,
        ap.job_title as alumni_job_title
        ${relevanceSelect}
       FROM opportunities o
       JOIN users u ON o.alumni_id = u.id
       LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
       ${whereClause}
       ${orderByClause}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM opportunities o ${whereClause}`,
      params.slice(0, type ? 1 : 0).concat(isRemote !== undefined ? [isRemote] : [])
    );

    return {
      opportunities: result.rows.map(row => ({
        ...this.formatOpportunity(row),
        alumni: {
          firstName: row.alumni_first_name,
          lastName: row.alumni_last_name,
          fullName: `${row.alumni_first_name} ${row.alumni_last_name}`,
          avatarUrl: row.alumni_avatar,
          company: row.alumni_company,
          jobTitle: row.alumni_job_title
        },
        relevanceScore: row.relevance_score || 0
      })),
      pagination: {
        total: parseInt(countResult.rows[0]?.count || 0),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0]?.count || 0) / limit)
      }
    };
  }

  // Get single opportunity
  async getOpportunityById(opportunityId, incrementViews = true) {
    const result = await query(
      `SELECT 
        o.*,
        u.first_name as alumni_first_name,
        u.last_name as alumni_last_name,
        u.avatar_url as alumni_avatar,
        u.email as alumni_email,
        ap.company as alumni_company,
        ap.job_title as alumni_job_title,
        ap.linkedin_url as alumni_linkedin
       FROM opportunities o
       JOIN users u ON o.alumni_id = u.id
       LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
       WHERE o.id = $1`,
      [opportunityId]
    );

    if (result.rows.length === 0) {
      throw new Error('Opportunity not found');
    }

    // Increment view count
    if (incrementViews) {
      await query(
        'UPDATE opportunities SET views_count = views_count + 1 WHERE id = $1',
        [opportunityId]
      );
    }

    const row = result.rows[0];
    return {
      ...this.formatOpportunity(row),
      alumni: {
        id: row.alumni_id,
        firstName: row.alumni_first_name,
        lastName: row.alumni_last_name,
        fullName: `${row.alumni_first_name} ${row.alumni_last_name}`,
        avatarUrl: row.alumni_avatar,
        email: row.alumni_email,
        company: row.alumni_company,
        jobTitle: row.alumni_job_title,
        linkedinUrl: row.alumni_linkedin
      }
    };
  }

  // Get alumni's opportunities
  async getAlumniOpportunities(alumniId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT * FROM opportunities
       WHERE alumni_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [alumniId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM opportunities WHERE alumni_id = $1',
      [alumniId]
    );

    return {
      opportunities: result.rows.map(row => this.formatOpportunity(row)),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  }

  // Update opportunity
  async updateOpportunity(opportunityId, alumniId, data) {
    const {
      title, description, type, company, location,
      isRemote, requiredSkills, requiredDomains,
      deadline, externalLink, isActive
    } = data;

    // Verify ownership
    const existing = await query(
      'SELECT id FROM opportunities WHERE id = $1 AND alumni_id = $2',
      [opportunityId, alumniId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Opportunity not found or not authorized');
    }

    const result = await query(
      `UPDATE opportunities SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        company = COALESCE($4, company),
        location = COALESCE($5, location),
        is_remote = COALESCE($6, is_remote),
        required_skills = COALESCE($7, required_skills),
        required_domains = COALESCE($8, required_domains),
        deadline = COALESCE($9, deadline),
        external_link = COALESCE($10, external_link),
        is_active = COALESCE($11, is_active)
       WHERE id = $12
       RETURNING *`,
      [
        title, description, type, company, location,
        isRemote, requiredSkills, requiredDomains,
        deadline, externalLink, isActive, opportunityId
      ]
    );

    return this.formatOpportunity(result.rows[0]);
  }

  // Delete opportunity
  async deleteOpportunity(opportunityId, alumniId) {
    const result = await query(
      'DELETE FROM opportunities WHERE id = $1 AND alumni_id = $2 RETURNING id',
      [opportunityId, alumniId]
    );

    if (result.rows.length === 0) {
      throw new Error('Opportunity not found or not authorized');
    }

    return { success: true };
  }

  // Apply for opportunity
  async applyForOpportunity(opportunityId, studentId, { coverNote, resumeUrl }, app = null) {
    // Check opportunity exists and is active
    const opportunityResult = await query(
      `SELECT o.id, o.deadline, o.title, o.alumni_id, o.required_skills, o.required_domains,
              u.first_name as student_first_name, u.last_name as student_last_name
       FROM opportunities o
       JOIN users u ON u.id = $2
       WHERE o.id = $1 AND o.is_active = true`,
      [opportunityId, studentId]
    );

    if (opportunityResult.rows.length === 0) {
      throw new Error('Opportunity not found or no longer accepting applications');
    }

    const opportunity = opportunityResult.rows[0];
    
    if (opportunity.deadline && new Date(opportunity.deadline) < new Date()) {
      throw new Error('Application deadline has passed');
    }

    // Check for existing application
    const existingApplication = await query(
      'SELECT id FROM opportunity_applications WHERE opportunity_id = $1 AND student_id = $2',
      [opportunityId, studentId]
    );

    if (existingApplication.rows.length > 0) {
      throw new Error('You have already applied for this opportunity');
    }

    // Analyze resume if provided
    let compatibilityScore = null;
    let skillAnalysis = null;

    if (resumeUrl && resumeService.isAvailable()) {
      try {
        console.log('🔍 Analyzing resume:', resumeUrl);
        console.log('📋 Required skills:', opportunity.required_skills);
        console.log('📋 Required domains:', opportunity.required_domains);
        
        const analysis = await resumeService.analyzeResume(
          resumeUrl,
          opportunity.required_skills || [],
          opportunity.required_domains || []
        );
        
        console.log('✅ Resume analysis result:', JSON.stringify(analysis, null, 2));
        
        if (analysis.success) {
          compatibilityScore = analysis.compatibilityScore;
          skillAnalysis = {
            matchedSkills: analysis.matchedSkills,
            missingSkills: analysis.missingSkills,
            additionalSkills: analysis.additionalSkills,
            experienceLevel: analysis.experienceLevel,
            summary: analysis.summary
          };
        }
      } catch (analysisError) {
        console.error('❌ Resume analysis failed:', analysisError.message);
        // Continue without analysis if it fails
      }
    } else {
      console.log('⚠️ Skipping resume analysis:', { resumeUrl, serviceAvailable: resumeService.isAvailable() });
    }

    // Create application with compatibility score
    const result = await query(
      `INSERT INTO opportunity_applications (opportunity_id, student_id, cover_note, resume_url, compatibility_score, skill_analysis)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [opportunityId, studentId, coverNote || null, resumeUrl || null, compatibilityScore, skillAnalysis ? JSON.stringify(skillAnalysis) : null]
    );

    // Increment applications count
    await query(
      'UPDATE opportunities SET applications_count = applications_count + 1 WHERE id = $1',
      [opportunityId]
    );

    // Send notification to alumni (non-blocking)
    const studentName = `${opportunity.student_first_name} ${opportunity.student_last_name}`;
    let notification = null;
    try {
      notification = await notificationService.notifyApplicationReceived(
        opportunity.alumni_id,
        studentName,
        opportunity.title,
        result.rows[0].id,
        opportunityId
      );

      // Emit real-time notification if app is available
      if (app && notification) {
        const io = app.get('io');
        if (io) {
          io.to(`user:${opportunity.alumni_id}`).emit('notification', notification);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError.message);
      // Don't fail the application if notification fails
    }

    return {
      applicationId: result.rows[0].id,
      status: result.rows[0].status,
      compatibilityScore,
      skillAnalysis,
      createdAt: result.rows[0].created_at
    };
  }

  // Get student's applications
  async getStudentApplications(studentId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        oa.*,
        o.title, o.type, o.company, o.deadline, o.is_active
       FROM opportunity_applications oa
       JOIN opportunities o ON oa.opportunity_id = o.id
       WHERE oa.student_id = $1
       ORDER BY oa.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    return result.rows.map(row => ({
      id: row.id,
      status: row.status,
      coverNote: row.cover_note,
      createdAt: row.created_at,
      opportunity: {
        id: row.opportunity_id,
        title: row.title,
        type: row.type,
        company: row.company,
        deadline: row.deadline,
        isActive: row.is_active
      }
    }));
  }

  // Withdraw application (student only)
  async withdrawApplication(applicationId, studentId) {
    // Verify ownership
    const application = await query(
      `SELECT oa.*, o.title, o.alumni_id 
       FROM opportunity_applications oa
       JOIN opportunities o ON oa.opportunity_id = o.id
       WHERE oa.id = $1`,
      [applicationId]
    );

    if (application.rows.length === 0) {
      throw new Error('Application not found');
    }

    if (String(application.rows[0].student_id) !== String(studentId)) {
      throw new Error('Not authorized to withdraw this application');
    }

    // Only allow withdrawal if status is pending or applied
    const status = application.rows[0].status;
    if (status !== 'pending' && status !== 'applied') {
      throw new Error(`Cannot withdraw application with status: ${status}`);
    }

    // Delete the application
    await query(
      'DELETE FROM opportunity_applications WHERE id = $1',
      [applicationId]
    );

    // Decrement applications count
    await query(
      'UPDATE opportunities SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = $1',
      [application.rows[0].opportunity_id]
    );

    return { success: true, message: 'Application withdrawn successfully' };
  }

  // Get applications for an opportunity (alumni only)
  async getOpportunityApplications(opportunityId, alumniId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    // Verify ownership - check if this alumni owns this opportunity
    const ownership = await query(
      'SELECT id, alumni_id FROM opportunities WHERE id = $1',
      [opportunityId]
    );

    if (ownership.rows.length === 0) {
      throw new Error('Opportunity not found');
    }

    // Compare as strings to handle UUID comparison
    if (String(ownership.rows[0].alumni_id) !== String(alumniId)) {
      console.log('Authorization check failed:', {
        opportunityAlumniId: ownership.rows[0].alumni_id,
        requestingUserId: alumniId
      });
      throw new Error('Not authorized to view applications for this opportunity');
    }

    const result = await query(
      `SELECT 
        oa.*,
        u.first_name, u.last_name, u.email, u.avatar_url,
        sp.major, sp.graduation_year, sp.skills
       FROM opportunity_applications oa
       JOIN users u ON oa.student_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE oa.opportunity_id = $1
       ORDER BY oa.created_at DESC
       LIMIT $2 OFFSET $3`,
      [opportunityId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM opportunity_applications WHERE opportunity_id = $1',
      [opportunityId]
    );

    return {
      applications: result.rows.map(row => ({
        id: row.id,
        status: row.status,
        coverNote: row.cover_note,
        resumeUrl: row.resume_url,
        compatibilityScore: row.compatibility_score,
        skillAnalysis: row.skill_analysis,
        createdAt: row.created_at,
        student: {
          id: row.student_id,
          firstName: row.first_name,
          lastName: row.last_name,
          fullName: `${row.first_name} ${row.last_name}`,
          email: row.email,
          avatarUrl: row.avatar_url,
          major: row.major,
          graduationYear: row.graduation_year,
          skills: row.skills || []
        }
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  }

  // Update application status (alumni only)
  async updateApplicationStatus(applicationId, alumniId, status, app = null) {
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Verify alumni owns the opportunity
    const appResult = await query(
      `SELECT oa.id, oa.student_id, o.title, o.alumni_id, o.id as opportunity_id
       FROM opportunity_applications oa
       JOIN opportunities o ON oa.opportunity_id = o.id
       WHERE oa.id = $1 AND o.alumni_id = $2`,
      [applicationId, alumniId]
    );

    if (appResult.rows.length === 0) {
      throw new Error('Application not found or not authorized');
    }

    const application = appResult.rows[0];

    // Update status
    await query(
      'UPDATE opportunity_applications SET status = $1 WHERE id = $2',
      [status, applicationId]
    );

    // Notify student about status change
    const notification = await notificationService.notifyApplicationStatusChange(
      application.student_id,
      status,
      application.title,
      application.opportunity_id
    );

    // Emit real-time notification
    if (app) {
      const io = app.get('io');
      if (io) {
        io.to(`user:${application.student_id}`).emit('notification', notification);
      }
    }

    return { success: true, status };
  }

  // Format opportunity for response
  formatOpportunity(opportunity) {
    return {
      id: opportunity.id,
      alumniId: opportunity.alumni_id,
      title: opportunity.title,
      description: opportunity.description,
      type: opportunity.type,
      company: opportunity.company,
      location: opportunity.location,
      isRemote: opportunity.is_remote,
      requiredSkills: opportunity.required_skills || [],
      requiredDomains: opportunity.required_domains || [],
      deadline: opportunity.deadline,
      externalLink: opportunity.external_link,
      isActive: opportunity.is_active,
      viewsCount: opportunity.views_count,
      applicationsCount: opportunity.applications_count,
      createdAt: opportunity.created_at,
      updatedAt: opportunity.updated_at
    };
  }
}

module.exports = new OpportunityService();
