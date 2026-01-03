const { query, transaction } = require('../config/database');
const { ROLES } = require('../config/constants');

class ProfileService {
  // Get student profile
  async getStudentProfile(userId) {
    const result = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.created_at,
        sp.skills, sp.domains, sp.interests, sp.career_goals,
        sp.university, sp.major, sp.graduation_year,
        sp.linkedin_url, sp.portfolio_url, sp.bio
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1 AND u.role = $2`,
      [userId, ROLES.STUDENT]
    );

    if (result.rows.length === 0) {
      throw new Error('Student profile not found');
    }

    return this.formatStudentProfile(result.rows[0]);
  }

  // Update student profile
  async updateStudentProfile(userId, profileData) {
    const {
      skills, domains, interests, careerGoals,
      university, major, graduationYear,
      linkedinUrl, portfolioUrl, bio, firstName, lastName, avatarUrl
    } = profileData;

    await transaction(async (client) => {
      // Update user basic info
      if (firstName || lastName || avatarUrl) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (firstName) {
          updates.push(`first_name = $${paramCount++}`);
          values.push(firstName);
        }
        if (lastName) {
          updates.push(`last_name = $${paramCount++}`);
          values.push(lastName);
        }
        if (avatarUrl !== undefined) {
          updates.push(`avatar_url = $${paramCount++}`);
          values.push(avatarUrl);
        }

        if (updates.length > 0) {
          values.push(userId);
          await client.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
          );
        }
      }

      // Update student profile
      await client.query(
        `UPDATE student_profiles SET
          skills = COALESCE($1, skills),
          domains = COALESCE($2, domains),
          interests = COALESCE($3, interests),
          career_goals = COALESCE($4, career_goals),
          university = COALESCE($5, university),
          major = COALESCE($6, major),
          graduation_year = COALESCE($7, graduation_year),
          linkedin_url = COALESCE($8, linkedin_url),
          portfolio_url = COALESCE($9, portfolio_url),
          bio = COALESCE($10, bio)
         WHERE user_id = $11`,
        [
          skills || null,
          domains || null,
          interests || null,
          careerGoals || null,
          university || null,
          major || null,
          graduationYear || null,
          linkedinUrl || null,
          portfolioUrl || null,
          bio || null,
          userId
        ]
      );
    });

    // Return updated profile
    return this.getStudentProfile(userId);
  }

  // Get alumni profile
  async getAlumniProfile(userId) {
    const result = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.created_at,
        ap.company, ap.job_title, ap.experience_years, ap.skills, ap.domains,
        ap.calcom_event_type_id, ap.calcom_username, ap.linkedin_url,
        ap.is_available_for_mentorship, ap.max_mentees, ap.current_mentees,
        ap.bio, ap.graduation_year, ap.alma_mater
       FROM users u
       JOIN alumni_profiles ap ON u.id = ap.user_id
       WHERE u.id = $1 AND u.role = $2`,
      [userId, ROLES.ALUMNI]
    );

    if (result.rows.length === 0) {
      throw new Error('Alumni profile not found');
    }

    return this.formatAlumniProfile(result.rows[0]);
  }

  // Update alumni profile
  async updateAlumniProfile(userId, profileData) {
    const {
      company, jobTitle, experienceYears, skills, domains,
      calcomEventTypeId, calcomUsername, linkedinUrl,
      isAvailableForMentorship, maxMentees, bio,
      graduationYear, almaMater, firstName, lastName, avatarUrl
    } = profileData;

    await transaction(async (client) => {
      // Update user basic info
      if (firstName || lastName || avatarUrl) {
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (firstName) {
          updates.push(`first_name = $${paramCount++}`);
          values.push(firstName);
        }
        if (lastName) {
          updates.push(`last_name = $${paramCount++}`);
          values.push(lastName);
        }
        if (avatarUrl !== undefined) {
          updates.push(`avatar_url = $${paramCount++}`);
          values.push(avatarUrl);
        }

        if (updates.length > 0) {
          values.push(userId);
          await client.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
          );
        }
      }

      // Update alumni profile
      await client.query(
        `UPDATE alumni_profiles SET
          company = COALESCE($1, company),
          job_title = COALESCE($2, job_title),
          experience_years = COALESCE($3, experience_years),
          skills = COALESCE($4, skills),
          domains = COALESCE($5, domains),
          calcom_event_type_id = COALESCE($6, calcom_event_type_id),
          calcom_username = COALESCE($7, calcom_username),
          linkedin_url = COALESCE($8, linkedin_url),
          is_available_for_mentorship = COALESCE($9, is_available_for_mentorship),
          max_mentees = COALESCE($10, max_mentees),
          bio = COALESCE($11, bio),
          graduation_year = COALESCE($12, graduation_year),
          alma_mater = COALESCE($13, alma_mater)
         WHERE user_id = $14`,
        [
          company || null,
          jobTitle || null,
          experienceYears || null,
          skills || null,
          domains || null,
          calcomEventTypeId || null,
          calcomUsername || null,
          linkedinUrl || null,
          isAvailableForMentorship !== undefined ? isAvailableForMentorship : null,
          maxMentees || null,
          bio || null,
          graduationYear || null,
          almaMater || null,
          userId
        ]
      );
    });

    // Return updated profile
    return this.getAlumniProfile(userId);
  }

  // Get all alumni (for listing/matchmaking)
  async getAllAlumni({ page = 1, limit = 10, availableOnly = false }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE u.role = $1 AND u.is_active = true';
    const params = [ROLES.ALUMNI];

    if (availableOnly) {
      whereClause += ' AND ap.is_available_for_mentorship = true';
      whereClause += ' AND ap.current_mentees < ap.max_mentees';
    }

    const result = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.avatar_url,
        ap.company, ap.job_title, ap.experience_years, ap.skills, ap.domains,
        ap.calcom_event_type_id, ap.is_available_for_mentorship,
        ap.max_mentees, ap.current_mentees, ap.bio, ap.alma_mater
       FROM users u
       JOIN alumni_profiles ap ON u.id = ap.user_id
       ${whereClause}
       ORDER BY ap.experience_years DESC, u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u
       JOIN alumni_profiles ap ON u.id = ap.user_id
       ${whereClause}`,
      params
    );

    return {
      alumni: result.rows.map(row => this.formatAlumniProfile(row)),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  }

  // Get alumni by ID (public view)
  async getAlumniById(alumniId) {
    const result = await query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.created_at,
        ap.company, ap.job_title, ap.experience_years, ap.skills, ap.domains,
        ap.calcom_event_type_id, ap.calcom_username, ap.linkedin_url,
        ap.is_available_for_mentorship, ap.max_mentees, ap.current_mentees,
        ap.bio, ap.graduation_year, ap.alma_mater
       FROM users u
       JOIN alumni_profiles ap ON u.id = ap.user_id
       WHERE u.id = $1 AND u.role = $2 AND u.is_active = true`,
      [alumniId, ROLES.ALUMNI]
    );

    if (result.rows.length === 0) {
      throw new Error('Alumni not found');
    }

    return this.formatAlumniProfile(result.rows[0]);
  }

  // Format student profile for response
  formatStudentProfile(row) {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`,
      avatarUrl: row.avatar_url,
      skills: row.skills || [],
      domains: row.domains || [],
      interests: row.interests,
      careerGoals: row.career_goals,
      university: row.university,
      major: row.major,
      graduationYear: row.graduation_year,
      linkedinUrl: row.linkedin_url,
      portfolioUrl: row.portfolio_url,
      bio: row.bio,
      createdAt: row.created_at
    };
  }

  // Format alumni profile for response
  formatAlumniProfile(row) {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`,
      avatarUrl: row.avatar_url,
      company: row.company,
      jobTitle: row.job_title,
      experienceYears: row.experience_years,
      skills: row.skills || [],
      domains: row.domains || [],
      calcomEventTypeId: row.calcom_event_type_id,
      calcomUsername: row.calcom_username,
      linkedinUrl: row.linkedin_url,
      isAvailableForMentorship: row.is_available_for_mentorship,
      maxMentees: row.max_mentees,
      currentMentees: row.current_mentees,
      bio: row.bio,
      graduationYear: row.graduation_year,
      almaMater: row.alma_mater,
      createdAt: row.created_at
    };
  }
}

module.exports = new ProfileService();
