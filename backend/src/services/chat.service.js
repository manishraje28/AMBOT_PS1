const { query } = require('../config/database');

class ChatService {
  // Get or create a conversation between two users
  async getOrCreateConversation(userId1, userId2) {
    // Order user IDs to ensure consistency
    const [p1, p2] = [userId1, userId2].sort();
    
    // Try to find existing conversation
    const existing = await query(
      `SELECT * FROM conversations 
       WHERE (participant_one = $1 AND participant_two = $2)
          OR (participant_one = $2 AND participant_two = $1)`,
      [p1, p2]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new conversation
    const result = await query(
      `INSERT INTO conversations (participant_one, participant_two)
       VALUES ($1, $2) RETURNING *`,
      [p1, p2]
    );

    return result.rows[0];
  }

  // Get all conversations for a user
  async getUserConversations(userId) {
    const result = await query(
      `SELECT 
        c.*,
        CASE 
          WHEN c.participant_one = $1 THEN c.participant_two
          ELSE c.participant_one
        END as other_user_id,
        u.first_name as other_first_name,
        u.last_name as other_last_name,
        u.avatar_url as other_avatar_url,
        u.role as other_role,
        (
          SELECT content FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM messages 
          WHERE conversation_id = c.id 
            AND sender_id != $1 
            AND is_read = false
        )::int as unread_count
       FROM conversations c
       JOIN users u ON u.id = CASE 
         WHEN c.participant_one = $1 THEN c.participant_two
         ELSE c.participant_one
       END
       WHERE c.participant_one = $1 OR c.participant_two = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Get messages for a conversation
  async getMessages(conversationId, userId, limit = 50, before = null) {
    // Verify user is part of the conversation
    const conv = await query(
      `SELECT * FROM conversations WHERE id = $1 
       AND (participant_one = $2 OR participant_two = $2)`,
      [conversationId, userId]
    );

    if (conv.rows.length === 0) {
      throw new Error('Access denied to this conversation');
    }

    let queryStr = `
      SELECT m.*, 
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.avatar_url as sender_avatar_url
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
    `;
    const params = [conversationId];

    if (before) {
      queryStr += ` AND m.created_at < $2`;
      params.push(before);
    }

    queryStr += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryStr, params);
    return result.rows.reverse(); // Return in chronological order
  }

  // Send a message
  async sendMessage(conversationId, senderId, content) {
    // Verify sender is part of the conversation
    const conv = await query(
      `SELECT * FROM conversations WHERE id = $1 
       AND (participant_one = $2 OR participant_two = $2)`,
      [conversationId, senderId]
    );

    if (conv.rows.length === 0) {
      throw new Error('Access denied to this conversation');
    }

    // Insert message
    const result = await query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [conversationId, senderId, content]
    );

    // Update conversation last_message_at
    await query(
      `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId]
    );

    // Get sender info
    const sender = await query(
      `SELECT first_name, last_name, avatar_url FROM users WHERE id = $1`,
      [senderId]
    );

    return {
      ...result.rows[0],
      sender_first_name: sender.rows[0].first_name,
      sender_last_name: sender.rows[0].last_name,
      sender_avatar_url: sender.rows[0].avatar_url,
    };
  }

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    await query(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
      [conversationId, userId]
    );
  }

  // Get unread message count for a user
  async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*)::int as count FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.participant_one = $1 OR c.participant_two = $1)
         AND m.sender_id != $1
         AND m.is_read = false`,
      [userId]
    );
    return result.rows[0].count;
  }

  // Get recipient ID from conversation
  async getRecipientId(conversationId, senderId) {
    const conv = await query(
      `SELECT participant_one, participant_two FROM conversations WHERE id = $1`,
      [conversationId]
    );

    if (conv.rows.length === 0) return null;

    const { participant_one, participant_two } = conv.rows[0];
    return participant_one === senderId ? participant_two : participant_one;
  }
}

module.exports = new ChatService();
