const axios = require('axios');
const { query, transaction } = require('../config/database');
const { BOOKING_STATUS, ROLES } = require('../config/constants');

class SchedulingService {
  constructor() {
    this.calcomApiUrl = process.env.CALCOM_API_URL || 'https://api.cal.com/v1';
    this.calcomApiKey = process.env.CALCOM_API_KEY;
    this.n8nWebhookBaseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  }

  // Get available slots from Cal.com for a specific alumni
  async getAvailableSlots(alumniId, { startDate, endDate }) {
    // Get alumni's Cal.com event type ID
    const alumniResult = await query(
      `SELECT ap.calcom_event_type_id, ap.calcom_username, u.first_name, u.last_name
       FROM alumni_profiles ap
       JOIN users u ON ap.user_id = u.id
       WHERE u.id = $1 AND u.role = $2`,
      [alumniId, ROLES.ALUMNI]
    );

    if (alumniResult.rows.length === 0) {
      throw new Error('Alumni not found');
    }

    const alumni = alumniResult.rows[0];

    if (!alumni.calcom_event_type_id) {
      throw new Error('Alumni has not configured their Cal.com availability');
    }

    try {
      // Fetch slots from Cal.com API
      const response = await axios.get(
        `${this.calcomApiUrl}/slots`,
        {
          params: {
            eventTypeId: alumni.calcom_event_type_id,
            startTime: startDate,
            endTime: endDate
          },
          headers: {
            'Authorization': `Bearer ${this.calcomApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        alumni: {
          id: alumniId,
          name: `${alumni.first_name} ${alumni.last_name}`,
          eventTypeId: alumni.calcom_event_type_id,
          username: alumni.calcom_username
        },
        slots: response.data.slots || []
      };
    } catch (error) {
      console.error('Cal.com API error:', error.response?.data || error.message);
      
      // If Cal.com is not available, trigger n8n webhook for slot retrieval
      return this.fetchSlotsViaN8n(alumni, startDate, endDate);
    }
  }

  // Fetch slots via n8n webhook
  async fetchSlotsViaN8n(alumni, startDate, endDate) {
    if (!this.n8nWebhookBaseUrl) {
      throw new Error('Scheduling service is temporarily unavailable');
    }

    try {
      const response = await axios.post(
        `${this.n8nWebhookBaseUrl}/get-slots`,
        {
          eventTypeId: alumni.calcom_event_type_id,
          calcomUsername: alumni.calcom_username,
          startDate,
          endDate,
          alumniName: `${alumni.first_name} ${alumni.last_name}`
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      return {
        alumni: {
          id: alumni.id,
          name: `${alumni.first_name} ${alumni.last_name}`,
          eventTypeId: alumni.calcom_event_type_id,
          username: alumni.calcom_username
        },
        slots: response.data.slots || []
      };
    } catch (error) {
      console.error('n8n webhook error:', error.message);
      throw new Error('Failed to fetch available slots. Please try again later.');
    }
  }

  // Book a mentorship session
  async bookSession(studentId, alumniId, { slotTime, notes }) {
    // Validate student
    const studentResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, sp.university, sp.major
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1 AND u.role = $2`,
      [studentId, ROLES.STUDENT]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Student not found');
    }

    const student = studentResult.rows[0];

    // Validate alumni and get Cal.com details
    const alumniResult = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name,
              ap.calcom_event_type_id, ap.calcom_username, ap.company
       FROM users u
       JOIN alumni_profiles ap ON u.id = ap.user_id
       WHERE u.id = $1 AND u.role = $2`,
      [alumniId, ROLES.ALUMNI]
    );

    if (alumniResult.rows.length === 0) {
      throw new Error('Alumni not found');
    }

    const alumni = alumniResult.rows[0];

    if (!alumni.calcom_event_type_id) {
      throw new Error('Alumni has not configured their scheduling availability');
    }

    // Check for existing booking at the same time
    const existingBooking = await query(
      `SELECT id FROM mentorship_sessions
       WHERE alumni_id = $1 AND scheduled_at = $2 AND status != 'cancelled'`,
      [alumniId, slotTime]
    );

    if (existingBooking.rows.length > 0) {
      throw new Error('This time slot is no longer available');
    }

    // Create booking via n8n webhook (which handles Cal.com booking)
    let bookingResult;
    try {
      bookingResult = await this.createBookingViaN8n({
        student,
        alumni,
        slotTime,
        notes
      });
    } catch (error) {
      console.error('Booking creation failed:', error);
      throw new Error('Failed to create booking. Please try again.');
    }

    // Store session in database
    const session = await transaction(async (client) => {
      const sessionResult = await client.query(
        `INSERT INTO mentorship_sessions (
          student_id, alumni_id, calcom_booking_id, calcom_event_type_id,
          scheduled_at, status, meeting_link, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          studentId,
          alumniId,
          bookingResult.bookingId || null,
          alumni.calcom_event_type_id,
          slotTime,
          BOOKING_STATUS.CONFIRMED,
          bookingResult.meetingLink || null,
          notes
        ]
      );

      // Increment alumni's current mentees count
      await client.query(
        `UPDATE alumni_profiles SET current_mentees = current_mentees + 1
         WHERE user_id = $1`,
        [alumniId]
      );

      return sessionResult.rows[0];
    });

    return {
      session: this.formatSession(session),
      meetingLink: bookingResult.meetingLink,
      calendarEventCreated: !!bookingResult.calendarEventId
    };
  }

  // Create booking via n8n webhook
  async createBookingViaN8n({ student, alumni, slotTime, notes }) {
    if (!this.n8nWebhookBaseUrl) {
      // Fallback: Direct Cal.com booking
      return this.createBookingDirect({ student, alumni, slotTime, notes });
    }

    try {
      const response = await axios.post(
        `${this.n8nWebhookBaseUrl}${process.env.N8N_BOOKING_WEBHOOK || '/mentorship-booking'}`,
        {
          eventTypeId: alumni.calcom_event_type_id,
          calcomUsername: alumni.calcom_username,
          student: {
            email: student.email,
            name: `${student.first_name} ${student.last_name}`,
            university: student.university,
            major: student.major
          },
          alumni: {
            email: alumni.email,
            name: `${alumni.first_name} ${alumni.last_name}`,
            company: alumni.company
          },
          slotTime,
          notes,
          timezone: 'UTC'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      return {
        bookingId: response.data.bookingId,
        meetingLink: response.data.meetingLink,
        calendarEventId: response.data.calendarEventId
      };
    } catch (error) {
      console.error('n8n booking webhook error:', error.message);
      throw new Error('Booking service temporarily unavailable');
    }
  }

  // Direct Cal.com booking (fallback)
  async createBookingDirect({ student, alumni, slotTime, notes }) {
    try {
      const response = await axios.post(
        `${this.calcomApiUrl}/bookings`,
        {
          eventTypeId: parseInt(alumni.calcom_event_type_id),
          start: slotTime,
          responses: {
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            notes: notes || 'Mentorship session booked via AMBOT platform'
          },
          metadata: {
            source: 'ambot_platform',
            studentId: student.id,
            alumniId: alumni.id
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.calcomApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        bookingId: response.data.id?.toString(),
        meetingLink: response.data.meetingUrl || response.data.references?.find(r => r.type === 'google_calendar')?.meetingUrl,
        calendarEventId: response.data.uid
      };
    } catch (error) {
      console.error('Cal.com booking error:', error.response?.data || error.message);
      throw new Error('Failed to create booking');
    }
  }

  // Get student's upcoming sessions
  async getStudentSessions(studentId, { status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE ms.student_id = $1';
    const params = [studentId];

    if (status) {
      whereClause += ` AND ms.status = $${params.length + 1}`;
      params.push(status);
    }

    const result = await query(
      `SELECT 
        ms.*,
        u.first_name as alumni_first_name,
        u.last_name as alumni_last_name,
        u.avatar_url as alumni_avatar,
        ap.company, ap.job_title
       FROM mentorship_sessions ms
       JOIN users u ON ms.alumni_id = u.id
       JOIN alumni_profiles ap ON u.id = ap.user_id
       ${whereClause}
       ORDER BY ms.scheduled_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => ({
      ...this.formatSession(row),
      alumni: {
        firstName: row.alumni_first_name,
        lastName: row.alumni_last_name,
        fullName: `${row.alumni_first_name} ${row.alumni_last_name}`,
        avatarUrl: row.alumni_avatar,
        company: row.company,
        jobTitle: row.job_title
      }
    }));
  }

  // Get alumni's sessions
  async getAlumniSessions(alumniId, { status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE ms.alumni_id = $1';
    const params = [alumniId];

    if (status) {
      whereClause += ` AND ms.status = $${params.length + 1}`;
      params.push(status);
    }

    const result = await query(
      `SELECT 
        ms.*,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.avatar_url as student_avatar,
        sp.university, sp.major
       FROM mentorship_sessions ms
       JOIN users u ON ms.student_id = u.id
       JOIN student_profiles sp ON u.id = sp.user_id
       ${whereClause}
       ORDER BY ms.scheduled_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => ({
      ...this.formatSession(row),
      student: {
        firstName: row.student_first_name,
        lastName: row.student_last_name,
        fullName: `${row.student_first_name} ${row.student_last_name}`,
        avatarUrl: row.student_avatar,
        university: row.university,
        major: row.major
      }
    }));
  }

  // Cancel session
  async cancelSession(sessionId, userId, reason) {
    const sessionResult = await query(
      'SELECT * FROM mentorship_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionResult.rows[0];

    // Verify user can cancel
    if (session.student_id !== userId && session.alumni_id !== userId) {
      throw new Error('Not authorized to cancel this session');
    }

    if (session.status === BOOKING_STATUS.CANCELLED) {
      throw new Error('Session is already cancelled');
    }

    if (session.status === BOOKING_STATUS.COMPLETED) {
      throw new Error('Cannot cancel a completed session');
    }

    // Update session status
    await transaction(async (client) => {
      await client.query(
        `UPDATE mentorship_sessions 
         SET status = $1, cancelled_by = $2, cancellation_reason = $3
         WHERE id = $4`,
        [BOOKING_STATUS.CANCELLED, userId, reason, sessionId]
      );

      // Decrement alumni's current mentees
      await client.query(
        `UPDATE alumni_profiles SET current_mentees = GREATEST(0, current_mentees - 1)
         WHERE user_id = $1`,
        [session.alumni_id]
      );
    });

    // Trigger n8n cancellation webhook
    if (this.n8nWebhookBaseUrl && session.calcom_booking_id) {
      try {
        await axios.post(
          `${this.n8nWebhookBaseUrl}/cancel-booking`,
          {
            bookingId: session.calcom_booking_id,
            sessionId,
            reason
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Cancellation webhook failed:', error.message);
      }
    }

    return { success: true };
  }

  // Complete session and add feedback
  async completeSession(sessionId, alumniId, { notes }) {
    const sessionResult = await query(
      'SELECT * FROM mentorship_sessions WHERE id = $1 AND alumni_id = $2',
      [sessionId, alumniId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    await query(
      `UPDATE mentorship_sessions 
       SET status = $1, alumni_notes = $2
       WHERE id = $3`,
      [BOOKING_STATUS.COMPLETED, notes, sessionId]
    );

    return { success: true };
  }

  // Add student feedback
  async addStudentFeedback(sessionId, studentId, { rating, feedback }) {
    const sessionResult = await query(
      'SELECT * FROM mentorship_sessions WHERE id = $1 AND student_id = $2',
      [sessionId, studentId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    await query(
      `UPDATE mentorship_sessions 
       SET student_rating = $1, student_feedback = $2
       WHERE id = $3`,
      [rating, feedback, sessionId]
    );

    return { success: true };
  }

  // Format session for response
  formatSession(session) {
    return {
      id: session.id,
      studentId: session.student_id,
      alumniId: session.alumni_id,
      scheduledAt: session.scheduled_at,
      durationMinutes: session.duration_minutes,
      status: session.status,
      meetingLink: session.meeting_link,
      notes: session.notes,
      studentRating: session.student_rating,
      studentFeedback: session.student_feedback,
      alumniNotes: session.alumni_notes,
      createdAt: session.created_at
    };
  }
}

module.exports = new SchedulingService();
