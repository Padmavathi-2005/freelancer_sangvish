import pool from '../config/db.js';

export const MessageModel = {
  checkConversationExists: async (userOneId, userTwoId) => {
    const firstId = Math.min(userOneId, userTwoId);
    const secondId = Math.max(userOneId, userTwoId);
    const query = `
      SELECT conversation_id FROM conversations 
      WHERE user_one_id = $1 AND user_two_id = $2
    `;
    const result = await pool.query(query, [firstId, secondId]);
    return result.rows[0];
  },

  createConversation: async (userOneId, userTwoId) => {
    const firstId = Math.min(userOneId, userTwoId);
    const secondId = Math.max(userOneId, userTwoId);
    const query = `
      INSERT INTO conversations (user_one_id, user_two_id)
      VALUES ($1, $2)
      ON CONFLICT (user_one_id, user_two_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING conversation_id
    `;
    const result = await pool.query(query, [firstId, secondId]);
    return result.rows[0];
  },

  findConversationsByUserId: async (userId) => {
    // We want to return the conversation details along with the other user's info
    // and the latest message in that chat room.
    const query = `
      SELECT 
        c.conversation_id,
        c.created_at,
        c.updated_at,
        c.admin_id,
        c.is_group,
        c.group_name,
        c.job_id,
        u.user_id as other_user_id,
        CONCAT(u.first_name, ' ', u.last_name) as other_user_name,
        CONCAT(u.first_name, ' ', u.last_name) as recipient_name,
        u.email as other_user_email,
        u.profile_image as other_user_profile_image,
        u.profile_image as recipient_image,
        u.profile_image as recipient_profile_image,
        fp.professional_title as other_user_title,
        fp.professional_title as recipient_role,
        lm.message_text as last_message_text,
        lm.created_at as last_message_time,
        lm.sender_id as last_message_sender_id,
        NULL::json as group_participants
      FROM conversations c
      JOIN users u ON (
        (c.is_group = FALSE OR c.is_group IS NULL) AND (
          (c.admin_id = $1 AND c.user_one_id = u.user_id) OR
          (COALESCE(c.admin_id, 0) != $1 AND (
            (c.user_one_id = $1 AND c.user_two_id = u.user_id) OR
            (c.user_two_id = $1 AND c.user_one_id = u.user_id)
          ))
        )
      )
      LEFT JOIN freelancer_profiles fp ON u.user_id = fp.user_id
      LEFT JOIN LATERAL (
        SELECT message_text, created_at, sender_id
        FROM messages
        WHERE conversation_id = c.conversation_id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE (c.is_group = FALSE OR c.is_group IS NULL) AND (c.user_one_id = $1 OR c.user_two_id = $1 OR c.admin_id = $1)
      
      UNION ALL
      
      SELECT 
        c.conversation_id,
        c.created_at,
        c.updated_at,
        c.admin_id,
        c.is_group,
        c.group_name,
        c.job_id,
        NULL as other_user_id,
        c.group_name as other_user_name,
        c.group_name as recipient_name,
        NULL as other_user_email,
        NULL as other_user_profile_image,
        NULL as recipient_image,
        NULL as recipient_profile_image,
        NULL as other_user_title,
        NULL as recipient_role,
        lm.message_text as last_message_text,
        lm.created_at as last_message_time,
        lm.sender_id as last_message_sender_id,
        (
          SELECT json_agg(json_build_object(
            'user_id', u2.user_id,
            'name', CONCAT(u2.first_name, ' ', u2.last_name),
            'profile_image', u2.profile_image
          ))
          FROM conversation_participants cp2
          JOIN users u2 ON cp2.user_id = u2.user_id
          WHERE cp2.conversation_id = c.conversation_id
        ) as group_participants
      FROM conversations c
      JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
      LEFT JOIN LATERAL (
        SELECT message_text, created_at, sender_id
        FROM messages
        WHERE conversation_id = c.conversation_id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE c.is_group = TRUE AND cp.user_id = $1
      
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(query, [parseInt(userId)]);
    return result.rows;
  },

  findMessagesByConversationId: async (conversationId) => {
    const query = `
      SELECT 
        m.*,
        CONCAT(u.first_name, ' ', u.last_name) as sender_name,
        u.profile_image as sender_profile_image
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query, [parseInt(conversationId)]);
    return result.rows;
  },

  createMessage: async (conversationId, senderId, messageText) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const insertMsgQuery = `
        INSERT INTO messages (conversation_id, sender_id, message_text)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const msgResult = await client.query(insertMsgQuery, [
        parseInt(conversationId),
        parseInt(senderId),
        messageText
      ]);

      const updateConvQuery = `
        UPDATE conversations 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE conversation_id = $1
      `;
      await client.query(updateConvQuery, [parseInt(conversationId)]);

      await client.query("COMMIT");
      return msgResult.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
};

export default MessageModel;
