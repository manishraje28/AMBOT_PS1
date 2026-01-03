const { query } = require('../config/database');
const { ROLES, MATCHING_WEIGHTS, CACHE_TTL } = require('../config/constants');
const NodeCache = require('node-cache');

// In-memory cache for matchmaking results
const matchCache = new NodeCache({ stdTTL: CACHE_TTL.MATCHMAKING, checkperiod: 60 });

class MatchmakingService {
  // Get matches for a student
  async getMatches(studentId, { limit = 5, forceRefresh = false } = {}) {
    // Check cache first
    const cacheKey = `matches_${studentId}`;
    if (!forceRefresh) {
      const cached = matchCache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for student ${studentId}`);
        return cached.slice(0, limit);
      }
    }

    // Get student profile
    const studentResult = await query(
      `SELECT sp.skills, sp.domains, sp.interests, sp.career_goals
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.id = $1 AND u.role = $2`,
      [studentId, ROLES.STUDENT]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Student profile not found');
    }

    const studentProfile = studentResult.rows[0];

    // Get all available alumni
    const alumniResult = await query(
      `SELECT 
        u.id, u.first_name, u.last_name, u.avatar_url,
        ap.company, ap.job_title, ap.experience_years, ap.skills, ap.domains,
        ap.calcom_event_type_id, ap.is_available_for_mentorship,
        ap.max_mentees, ap.current_mentees, ap.bio
       FROM users u
       JOIN alumni_profiles ap ON u.id = ap.user_id
       WHERE u.role = $1 
         AND u.is_active = true
         AND ap.is_available_for_mentorship = true
         AND ap.current_mentees < ap.max_mentees`,
      [ROLES.ALUMNI]
    );

    // Calculate match scores
    const matches = alumniResult.rows.map(alumni => {
      const score = this.calculateMatchScore(studentProfile, alumni);
      return {
        alumni: this.formatAlumniForMatch(alumni),
        score,
        matchDetails: this.getMatchDetails(studentProfile, alumni)
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Cache the results
    matchCache.set(cacheKey, matches);

    // Also store in database for persistence
    await this.cacheMatchesToDB(studentId, matches);

    return matches.slice(0, limit);
  }

  // Calculate match score between student and alumni
  calculateMatchScore(studentProfile, alumniProfile) {
    let score = 0;

    // Domain matching (+3 per match)
    const studentDomains = (studentProfile.domains || []).map(d => d.toLowerCase());
    const alumniDomains = (alumniProfile.domains || []).map(d => d.toLowerCase());
    const domainMatches = studentDomains.filter(d => alumniDomains.includes(d)).length;
    score += domainMatches * MATCHING_WEIGHTS.DOMAIN_MATCH;

    // Skill overlap (+2 per match)
    const studentSkills = (studentProfile.skills || []).map(s => s.toLowerCase());
    const alumniSkills = (alumniProfile.skills || []).map(s => s.toLowerCase());
    const skillMatches = studentSkills.filter(s => alumniSkills.includes(s)).length;
    score += skillMatches * MATCHING_WEIGHTS.SKILL_OVERLAP;

    // Career goal alignment (+1)
    if (studentProfile.career_goals && alumniProfile.job_title) {
      const careerGoals = studentProfile.career_goals.toLowerCase();
      const jobTitle = alumniProfile.job_title.toLowerCase();
      const company = (alumniProfile.company || '').toLowerCase();
      
      // Check for keyword matches
      const keywords = careerGoals.split(/\s+/).filter(k => k.length > 3);
      const hasAlignment = keywords.some(k => 
        jobTitle.includes(k) || company.includes(k)
      );
      
      if (hasAlignment) {
        score += MATCHING_WEIGHTS.CAREER_GOAL_ALIGNMENT;
      }
    }

    // Bonus for experience
    if (alumniProfile.experience_years >= 5) {
      score += 1;
    }

    return score;
  }

  // Get detailed match information
  getMatchDetails(studentProfile, alumniProfile) {
    const studentDomains = (studentProfile.domains || []).map(d => d.toLowerCase());
    const alumniDomains = (alumniProfile.domains || []).map(d => d.toLowerCase());
    const matchedDomains = studentDomains.filter(d => alumniDomains.includes(d));

    const studentSkills = (studentProfile.skills || []).map(s => s.toLowerCase());
    const alumniSkills = (alumniProfile.skills || []).map(s => s.toLowerCase());
    const matchedSkills = studentSkills.filter(s => alumniSkills.includes(s));

    return {
      matchedDomains,
      matchedSkills,
      domainMatchCount: matchedDomains.length,
      skillMatchCount: matchedSkills.length,
      hasCareerAlignment: this.checkCareerAlignment(studentProfile, alumniProfile)
    };
  }

  // Check career goal alignment
  checkCareerAlignment(studentProfile, alumniProfile) {
    if (!studentProfile.career_goals || !alumniProfile.job_title) {
      return false;
    }

    const careerGoals = studentProfile.career_goals.toLowerCase();
    const jobTitle = alumniProfile.job_title.toLowerCase();
    const company = (alumniProfile.company || '').toLowerCase();
    
    const keywords = careerGoals.split(/\s+/).filter(k => k.length > 3);
    return keywords.some(k => jobTitle.includes(k) || company.includes(k));
  }

  // Format alumni data for match response
  formatAlumniForMatch(alumni) {
    return {
      id: alumni.id,
      firstName: alumni.first_name,
      lastName: alumni.last_name,
      fullName: `${alumni.first_name} ${alumni.last_name}`,
      avatarUrl: alumni.avatar_url,
      company: alumni.company,
      jobTitle: alumni.job_title,
      experienceYears: alumni.experience_years,
      skills: alumni.skills || [],
      domains: alumni.domains || [],
      bio: alumni.bio,
      calcomEventTypeId: alumni.calcom_event_type_id,
      isAvailableForMentorship: alumni.is_available_for_mentorship
    };
  }

  // Cache matches to database
  async cacheMatchesToDB(studentId, matches) {
    const expiresAt = new Date(Date.now() + CACHE_TTL.MATCHMAKING * 1000);
    
    // Delete old cache
    await query(
      'DELETE FROM matchmaking_cache WHERE student_id = $1',
      [studentId]
    );

    // Insert new cache
    await query(
      `INSERT INTO matchmaking_cache (student_id, cached_matches, expires_at)
       VALUES ($1, $2, $3)`,
      [studentId, JSON.stringify(matches), expiresAt]
    );
  }

  // Get cached matches from database
  async getCachedMatchesFromDB(studentId) {
    const result = await query(
      `SELECT cached_matches FROM matchmaking_cache
       WHERE student_id = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].cached_matches;
  }

  // Invalidate cache for a student
  invalidateCache(studentId) {
    const cacheKey = `matches_${studentId}`;
    matchCache.del(cacheKey);
  }

  // Clear all matchmaking caches
  clearAllCaches() {
    matchCache.flushAll();
  }
}

module.exports = new MatchmakingService();
