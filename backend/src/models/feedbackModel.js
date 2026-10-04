const db = require('../config/db');

/**
 * Feedback Model - Tương tác dữ liệu bảng feedback
 */
const FeedbackModel = {
  async create({ userId, title, content, category = 'gop_y', images = [] }) {
    const [result] = await db.query(
      'INSERT INTO feedback (user_id, title, content, category, images, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", NOW())',
      [userId || null, title, content, category, JSON.stringify(images)]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await db.query(`
      SELECT f.*, u.full_name as user_name, u.email as user_email, u.mssv
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `);
    return rows;
  },

  async updateStatus(id, status, adminReply = null) {
    const [result] = await db.query(
      'UPDATE feedback SET status = ?, admin_reply = ?, updated_at = NOW() WHERE id = ?',
      [status, adminReply, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = FeedbackModel;
