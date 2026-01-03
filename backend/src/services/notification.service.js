const { query } = require('../config/database');

class NotificationService {
  // Create a notification
  async create(userId, type, title, message, data = {}) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );
    return result.rows[0];
  }

  // Get notifications for a user
  async getUserNotifications(userId, limit = 20, offset = 0, unreadOnly = false) {
    let queryStr = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (unreadOnly) {
      queryStr += ` AND is_read = false`;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);

    const result = await query(queryStr, params);
    return result.rows;
  }

  // Get unread count
  async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*)::int as count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return result.rows[0].count;
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    await query(
      `UPDATE notifications SET is_read = true 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  // Delete a notification
  async delete(notificationId, userId) {
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  // Notification type helpers
  async notifyApplicationReceived(alumniId, studentName, opportunityTitle, applicationId, opportunityId) {
    return this.create(
      alumniId,
      'application_received',
      'New Application Received',
      `${studentName} has applied to your opportunity: ${opportunityTitle}`,
      { applicationId, opportunityId }
    );
  }

  async notifyApplicationStatusChange(studentId, status, opportunityTitle, opportunityId) {
    const statusMessages = {
      reviewed: 'is being reviewed',
      shortlisted: 'has been shortlisted! 🎉',
      rejected: 'was not selected',
      accepted: 'has been accepted! 🎉',
    };

    return this.create(
      studentId,
      'application_status',
      'Application Update',
      `Your application for "${opportunityTitle}" ${statusMessages[status] || 'has been updated'}`,
      { status, opportunityId }
    );
  }

  async notifyNewMessage(userId, senderName, conversationId) {
    return this.create(
      userId,
      'new_message',
      'New Message',
      `You have a new message from ${senderName}`,
      { conversationId }
    );
  }

  async notifySessionBooked(alumniId, studentName, sessionTime, sessionId) {
    return this.create(
      alumniId,
      'session_booked',
      'New Session Booked',
      `${studentName} has booked a mentorship session with you`,
      { sessionId, sessionTime }
    );
  }

  async notifySessionReminder(userId, otherName, sessionTime, sessionId) {
    return this.create(
      userId,
      'session_reminder',
      'Session Reminder',
      `Your mentorship session with ${otherName} is coming up soon`,
      { sessionId, sessionTime }
    );
  }
}

module.exports = new NotificationService();
