const db = require('../config/db');

/**
 * General Controller - Quản lý thông báo chung
 * (Đã loại bỏ các API không dùng: surveys, support_tickets)
 */

// Get Notifications (with pagination)
exports.getNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ success: true, page, limit, notifications: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thông báo', error: error.message });
  }
};

// Get Notification by ID
exports.getNotificationById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
    }
    res.json({ success: true, notification: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết thông báo', error: error.message });
  }
};
