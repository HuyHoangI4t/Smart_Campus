const db = require('../config/db');

/**
 * SOS Model - Tương tác dữ liệu bảng sos_alerts
 */
const SosModel = {
  async create({ userId, alertType, latitude, longitude, address, description }) {
    const [result] = await db.query(
      'INSERT INTO sos_alerts (user_id, alert_type, latitude, longitude, address, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "active", NOW())',
      [userId || null, alertType, latitude, longitude, address, description]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await db.query(`
      SELECT s.*, u.full_name as user_name, u.phone as user_phone, u.mssv
      FROM sos_alerts s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    return rows;
  },

  async resolveAlert(id, adminNotes = null) {
    const [result] = await db.query(
      'UPDATE sos_alerts SET status = "resolved", resolved_at = NOW(), admin_notes = ? WHERE id = ?',
      [adminNotes, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = SosModel;
