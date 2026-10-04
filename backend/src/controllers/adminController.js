const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 1. Lấy thống kê tổng quan (Dashboard Stats)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [[usersCount]] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [[studentsCount]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'sinh_vien' OR role IS NULL");
    const [[notificationsCount]] = await db.query('SELECT COUNT(*) AS total FROM notifications');
    const [[feedbackCount]] = await db.query('SELECT COUNT(*) AS total FROM feedback');
    const [[sosCount]] = await db.query('SELECT COUNT(*) AS total FROM sos_alerts');
    const [[gradesCount]] = await db.query('SELECT COUNT(*) AS total FROM student_grades');

    const [recentFeedback] = await db.query('SELECT * FROM feedback ORDER BY id DESC LIMIT 5');
    const [recentSos] = await db.query('SELECT * FROM sos_alerts ORDER BY id DESC LIMIT 5');

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount.total,
        totalStudents: studentsCount.total,
        totalNotifications: notificationsCount.total,
        totalFeedback: feedbackCount.total,
        totalSosAlerts: sosCount.total,
        totalGrades: gradesCount.total,
      },
      recentFeedback,
      recentSos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thống kê admin: ' + error.message });
  }
};

/**
 * 2. Quản lý người dùng (Users / Sinh viên)
 */
exports.getUsers = async (req, res) => {
  const search = req.query.search ? `%${req.query.search.trim()}%` : null;
  const role = req.query.role || null;

  try {
    let sql = 'SELECT id, mssv, ho_ten, email, role, so_dien_thoai, lop, khoa, avatar, created_at FROM users';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(mssv LIKE ? OR ho_ten LIKE ? OR email LIKE ? OR lop LIKE ? OR khoa LIKE ?)');
      params.push(search, search, search, search, search);
    }

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id DESC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, users: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách người dùng: ' + error.message });
  }
};

exports.createUser = async (req, res) => {
  const { mssv, ho_ten, email, password, role, so_dien_thoai, lop, khoa } = req.body;

  if (!mssv || !password) {
    return res.status(400).json({ success: false, message: 'MSSV và mật khẩu là bắt buộc.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE mssv = ?', [mssv]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Mã số sinh viên ${mssv} đã tồn tại trong hệ thống.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(`
      INSERT INTO users (mssv, ho_ten, email, password, role, so_dien_thoai, lop, khoa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mssv.trim(),
      ho_ten ? ho_ten.trim() : ('Sinh viên ' + mssv),
      email ? email.trim() : `${mssv}@sv.ttn.edu.vn`,
      hashedPassword,
      role || 'sinh_vien',
      so_dien_thoai || '',
      lop || 'Kỹ thuật phần mềm K23',
      khoa || 'Công nghệ Thông tin'
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản người dùng mới thành công.',
      user: { mssv, ho_ten, email, role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản: ' + error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { ho_ten, email, role, so_dien_thoai, lop, khoa, password } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const u = existing[0];
    const newName = ho_ten !== undefined ? ho_ten : u.ho_ten;
    const newEmail = email !== undefined ? email : u.email;
    const newRole = role !== undefined ? role : u.role;
    const newPhone = so_dien_thoai !== undefined ? so_dien_thoai : u.so_dien_thoai;
    const newLop = lop !== undefined ? lop : u.lop;
    const newKhoa = khoa !== undefined ? khoa : u.khoa;

    let newPasswordHash = u.password;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      newPasswordHash = await bcrypt.hash(password.trim(), salt);
    }

    await db.query(`
      UPDATE users 
      SET ho_ten = ?, email = ?, role = ?, so_dien_thoai = ?, lop = ?, khoa = ?, password = ?
      WHERE id = ?
    `, [newName, newEmail, newRole, newPhone, newLop, newKhoa, newPasswordHash, id]);

    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công.',
      user: { id, mssv: u.mssv, ho_ten: newName, email: newEmail, role: newRole }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật người dùng: ' + error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT mssv FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng cần xóa.' });
    }

    const mssv = existing[0].mssv;
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    await db.query('DELETE FROM student_grades WHERE mssv = ?', [mssv]);
    await db.query('DELETE FROM student_schedules WHERE mssv = ?', [mssv]);

    res.json({
      success: true,
      message: `Đã xóa tài khoản MSSV ${mssv} và dữ liệu liên quan thành công.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa tài khoản: ' + error.message });
  }
};

/**
 * 3. Quản lý thông báo (Notifications)
 */
exports.createNotification = async (req, res) => {
  const { title, content, type, sender, date } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung thông báo là bắt buộc.' });
  }

  try {
    const notifDate = date || new Date().toLocaleDateString('vi-VN');
    const [result] = await db.query(
      'INSERT INTO notifications (title, content, type, sender, date) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), content.trim(), type || 'info', sender || 'Phòng Đào Tạo', notifDate]
    );

    res.status(201).json({
      success: true,
      message: 'Đăng thông báo mới thành công.',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo thông báo: ' + error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM notifications WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa thông báo thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa thông báo: ' + error.message });
  }
};

/**
 * 4. Quản lý phản hồi (Feedback)
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, u.ho_ten, u.lop, u.email 
      FROM feedback f 
      LEFT JOIN users u ON f.mssv = u.mssv 
      ORDER BY f.id DESC
    `);
    res.json({ success: true, feedback: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy phản hồi: ' + error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM feedback WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa ý kiến phản hồi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa phản hồi: ' + error.message });
  }
};

/**
 * 5. Quản lý cảnh báo SOS
 */
exports.getAllSosAlerts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.ho_ten, u.so_dien_thoai, u.lop 
      FROM sos_alerts s 
      LEFT JOIN users u ON s.mssv = u.mssv 
      ORDER BY s.id DESC
    `);
    res.json({ success: true, alerts: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách cảnh báo SOS: ' + error.message });
  }
};

exports.deleteSosAlert = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM sos_alerts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa cảnh báo SOS.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa cảnh báo SOS: ' + error.message });
  }
};
