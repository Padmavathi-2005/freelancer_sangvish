import pool from '../config/db.js';

class Notification {
  static async create({ userId, title, message, type = 'system', referenceId = null }) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, message, type, referenceId]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

export default Notification;
