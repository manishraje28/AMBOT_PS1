const axios = require('axios');
const { query, transaction } = require('../config/database');
const { BOOKING_STATUS, ROLES } = require('../config/constants');

// Cal.com API v1 base URL (v1 works with regular API keys for bookings)
const CALCOM_API_V1_URL = 'https://api.cal.com/v1';
// Cal.com API v2 for slots (some endpoints work with API keys)
const CALCOM_API_V2_URL = 'https://api.cal.com/v2';
const CAL_API_VERSION = '2024-08-13';

class SchedulingService {
  constructor() {
    this.calcomApiKey = process.env.CALCOM_API_KEY;
    this.n8nWebhookBaseUrl = process.env.N8N_WEBHOOK_BASE_URL;
    
    if (!this.calcomApiKey) {
      console.warn('⚠️ CALCOM_API_KEY not configured - Cal.com direct integration will not work');
    }
  }

  // Get available slots from Cal.com for a specific alumni
  async getAvailableSlots(alumniId, { startDate, endDate }) {
    // Check if API key is configured
    if (!this.calcomApiKey) {
      console.error('Cal.com API key not configured');
      return this.fetchSlotsViaN8n({ calcom_event_type_id: null }, startDate, endDate);
    }
    
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
      // Fetch slots from Cal.com API v1 (works with regular API keys)
      console.log('Fetching Cal.com slots for eventTypeId:', alumni.calcom_event_type_id);
      console.log('Date range:', startDate, 'to', endDate);
      
      const response = await axios.get(
        `${CALCOM_API_V1_URL}/slots`,
        {
          params: {
            apiKey: this.calcomApiKey,
            eventTypeId: alumni.calcom_event_type_id,
            startTime: startDate,
            endTime: endDate,
            timeZone: 'UTC'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Cal.com API response:', JSON.stringify(response.data, null, 2));
      
      // Transform v1 response format to our expected format
      // v1 returns: { slots: { '2024-01-05': [{ time: '...' }] } }
      const slotsData = response.data.slots || response.data.data || {};
      const slots = [];
      
      // Convert the date-keyed object to an array of slots
      for (const [date, dateSlots] of Object.entries(slotsData)) {
        if (Array.isArray(dateSlots)) {
          dateSlots.forEach(slot => {
            slots.push({
              time: slot.start || slot.time || slot,
              date: date
            });
          });
        }
      }

      return {
        alumni: {
          id: alumniId,
          name: `${alumni.first_name} ${alumni.last_name}`,
          eventTypeId: alumni.calcom_event_type_id,
          username: alumni.calcom_username
        },
        slots: slots
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

    // Hardcoded Google Meet link for now (TODO: replace with dynamic meeting link)
    const meetingLink = 'https://meet.google.com/dfs-ywam-mez';

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
          meetingLink,
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
      meetingLink: meetingLink,
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

  // Direct Cal.com booking using API v1 (works with regular API keys)
  async createBookingDirect({ student, alumni, slotTime, notes }) {
    try {
      const startDate = new Date(slotTime);
      
      // Don't include 'end' - let Cal.com use the event type's configured duration
      const bookingPayload = {
        eventTypeId: parseInt(alumni.calcom_event_type_id),
        start: startDate.toISOString(),
        responses: {
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          location: {
            value: 'integrations:daily',
            optionValue: ''
          }
        },
        timeZone: 'UTC',
        language: 'en',
        metadata: {
          source: 'ambot_platform',
          studentId: student.id,
          alumniId: alumni.id,
          notes: notes || 'Mentorship session booked via AMBOT platform'
        }
      };

      console.log('Creating Cal.com booking with payload:', JSON.stringify(bookingPayload, null, 2));

      const response = await axios.post(
        `${CALCOM_API_V1_URL}/bookings`,
        bookingPayload,
        {
          params: {
            apiKey: this.calcomApiKey
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Cal.com booking response:', JSON.stringify(response.data, null, 2));

      const booking = response.data.booking || response.data;
      
      // Extract meeting link from various possible fields in Cal.com response
      let meetingLink = booking.meetingUrl || 
                        booking.location || 
                        booking.references?.find(ref => ref.type === 'daily_video')?.meetingUrl ||
                        booking.metadata?.videoCallUrl;
      
      // If Cal.com provides a UID, we can construct a meeting link
      if (!meetingLink && booking.uid) {
        // The Cal.com video meeting is accessed via the booking page
        meetingLink = `https://app.cal.com/video/${booking.uid}`;
      }
      
      console.log('Meeting link extracted:', meetingLink);
      
      return {
        bookingId: booking.id?.toString(),
        meetingLink: meetingLink,
        calendarEventId: booking.uid
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
