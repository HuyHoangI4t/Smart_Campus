const db = require('../config/db');

/**
 * Notification Model - Tương tác dữ liệu bảng notifications
 */
const NotificationModel = {
  async getAll(limit = 50) {
    const [rows] = await db.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(title, content, type = 'general', targetRole = 'all') {
    const [result] = await db.query(
      'INSERT INTO notifications (title, content, type, target_role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [title, content, type, targetRole]
    );
    return result.insertId;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = NotificationModel;
