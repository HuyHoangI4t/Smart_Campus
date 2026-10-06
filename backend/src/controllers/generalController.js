const db = require('../config/db');

/**
 * General Controller - Quản lý thông báo chung
 * (Đã loại bỏ các API không dùng: surveys, support_tickets)
 */

// Get Notifications (with pagination)
exports.getNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({
      success: true,
      page,
      limit,
      total: rows.length,
      notifications: rows,
      data: rows
    });
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
    res.json({ success: true, notification: rows[0], data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết thông báo', error: error.message });
  }
};

// Create Notification (Phát thông báo)
exports.createNotification = async (req, res) => {
  const { title, content, type, sender, date } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung thông báo là bắt buộc.' });
  }

  try {
    const notifDate = date || new Date().toLocaleDateString('vi-VN');
    const notifType = type || 'info';
    const notifSender = sender || 'Phòng Đào Tạo';
    const [result] = await db.query(
      'INSERT INTO notifications (title, content, type, sender, date) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), content.trim(), notifType, notifSender, notifDate]
    );

    const newNotif = {
      id: result.insertId,
      title: title.trim(),
      content: content.trim(),
      type: notifType,
      sender: notifSender,
      date: notifDate,
      created_at: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Phát thông báo thành công.',
      id: result.insertId,
      notification: newNotif,
      data: newNotif
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi phát thông báo: ' + error.message });
  }
};

// Delete Notification
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa thông báo thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa thông báo: ' + error.message });
  }
};
