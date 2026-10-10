const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 1. Lấy thống kê tổng quan (Dashboard Stats)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      [[usersCount]],
      [[studentsCount]],
      [[notificationsCount]],
      [[feedbackCount]],
      [[resolvedFeedbackCount]],
      [[sosCount]],
      [[resolvedSosCount]],
      [[locationsCount]],
      [recentFeedback],
      [recentSos]
    ] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM users'),
      db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'sinh_vien' OR role IS NULL"),
      db.query('SELECT COUNT(*) AS total FROM notifications'),
      db.query('SELECT COUNT(*) AS total FROM feedback'),
      db.query("SELECT COUNT(*) AS total FROM feedback WHERE status = 'Đã giải quyết'"),
      db.query('SELECT COUNT(*) AS total FROM sos_alerts'),
      db.query("SELECT COUNT(*) AS total FROM sos_alerts WHERE status = 'Đã xử lý'"),
      db.query('SELECT COUNT(*) AS total FROM map_locations'),
      db.query('SELECT * FROM feedback ORDER BY id DESC LIMIT 5'),
      db.query('SELECT * FROM sos_alerts ORDER BY id DESC LIMIT 5')
    ]);

    // 2. Tổng hợp dữ liệu 7 ngày trong tuần (T2 -> CN) thực tế từ MySQL cho biểu đồ
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const currentWeekDays = [];
    const weekLookup = {};

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 là CN, 1 là T2...
    const distToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    const pad = (n) => String(n).padStart(2, '0');
    const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toDateKey(d);
      weekLookup[dateStr] = i;
      currentWeekDays.push({
        label: dayLabels[i],
        date: dateStr,
        interactions: 0,
        feedback: 0,
        sos: 0,
        resolved: 0,
        sosResolved: 0,
        feedbackResolved: 0
      });
    }

    // Tuần trước để so sánh xu hướng thực tế
    const prevWeekDays = [];
    const prevWeekLookup = {};
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(prevMonday);
      d.setDate(prevMonday.getDate() + i);
      const dateStr = toDateKey(d);
      prevWeekLookup[dateStr] = i;
      prevWeekDays.push({
        label: dayLabels[i],
        date: dateStr,
        interactions: 0
      });
    }

    const startDate = `${currentWeekDays[0].date} 00:00:00`;
    const endDate = `${currentWeekDays[6].date} 23:59:59`;
    const prevStartDate = `${prevWeekDays[0].date} 00:00:00`;
    const prevEndDate = `${prevWeekDays[6].date} 23:59:59`;

    const [
      [feedbackRows],
      [activityRows],
      [prevActivityRows],
      [sosRows],
      [resolvedSosRows],
      [resolvedFeedbackRows]
    ] = await Promise.all([
      db.query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as f_date, COUNT(*) as cnt FROM feedback WHERE created_at >= ? AND created_at <= ? AND created_at <= NOW() GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')",
        [startDate, endDate]
      ).catch(() => [[]]),
      db.query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as a_date, COUNT(*) as cnt FROM activity_logs WHERE created_at >= ? AND created_at <= ? AND created_at <= NOW() GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')",
        [startDate, endDate]
      ).catch(() => [[]]),
      db.query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as a_date, COUNT(*) as cnt FROM activity_logs WHERE created_at >= ? AND created_at <= ? AND created_at <= NOW() GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')",
        [prevStartDate, prevEndDate]
      ).catch(() => [[]]),
      db.query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as s_date, COUNT(*) as cnt FROM sos_alerts WHERE created_at >= ? AND created_at <= ? AND created_at <= NOW() GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')",
        [startDate, endDate]
      ).catch(() => [[]]),
      db.query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as s_date, COUNT(*) as cnt FROM sos_alerts WHERE (status = 'Đã xử lý' OR status = 'Đã tiếp nhận & hỗ trợ') AND created_at >= ? AND created_at <= ? AND created_at <= NOW() GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')",
        [startDate, endDate]
      ).catch(() => [[]]),
      db.query(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as f_date, COUNT(*) as cnt FROM feedback WHERE status = 'Đã giải quyết' AND created_at >= ? AND created_at <= ? AND created_at <= NOW() GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')",
        [startDate, endDate]
      ).catch(() => [[]])
    ]);

    if (Array.isArray(feedbackRows)) {
      for (const row of feedbackRows) {
        const dStr = String(row.f_date || '');
        if (weekLookup[dStr] !== undefined) {
          currentWeekDays[weekLookup[dStr]].feedback = Number(row.cnt) || 0;
        }
      }
    }

    if (Array.isArray(activityRows)) {
      for (const row of activityRows) {
        const dStr = String(row.a_date || '');
        if (weekLookup[dStr] !== undefined) {
          currentWeekDays[weekLookup[dStr]].interactions = Number(row.cnt) || 0;
        }
      }
    }

    if (Array.isArray(prevActivityRows)) {
      for (const row of prevActivityRows) {
        const dStr = String(row.a_date || '');
        if (prevWeekLookup[dStr] !== undefined) {
          prevWeekDays[prevWeekLookup[dStr]].interactions = Number(row.cnt) || 0;
        }
      }
    }

    if (Array.isArray(sosRows)) {
      for (const row of sosRows) {
        const dStr = String(row.s_date || '');
        if (weekLookup[dStr] !== undefined) {
          currentWeekDays[weekLookup[dStr]].sos = Number(row.cnt) || 0;
        }
      }
    }

    if (Array.isArray(resolvedSosRows)) {
      for (const row of resolvedSosRows) {
        const dStr = String(row.s_date || '');
        if (weekLookup[dStr] !== undefined) {
          currentWeekDays[weekLookup[dStr]].sosResolved = Number(row.cnt) || 0;
        }
      }
    }

    if (Array.isArray(resolvedFeedbackRows)) {
      for (const row of resolvedFeedbackRows) {
        const dStr = String(row.f_date || '');
        if (weekLookup[dStr] !== undefined) {
          currentWeekDays[weekLookup[dStr]].feedbackResolved = Number(row.cnt) || 0;
        }
      }
    }

    // Tổng hợp số vụ giải quyết trong ngày (bao gồm cả SOS đã xử lý và phản ánh đã giải quyết)
    for (const d of currentWeekDays) {
      d.resolved = (d.sosResolved || 0) + (d.feedbackResolved || 0);
    }

    const activityChart = {
      labels: currentWeekDays.map(d => d.label),
      dates: currentWeekDays.map(d => d.date),
      interactions: currentWeekDays.map(d => d.interactions),
      prevInteractions: prevWeekDays.map(d => d.interactions),
      feedback: currentWeekDays.map(d => d.feedback),
      sos: currentWeekDays.map(d => d.sos),
      resolved: currentWeekDays.map(d => d.resolved),
      sosResolved: currentWeekDays.map(d => d.sosResolved),
      feedbackResolved: currentWeekDays.map(d => d.feedbackResolved)
    };

    res.json({
      success: true,
      stats: {
        totalUsers: Number(usersCount.total || 0),
        totalStudents: Number(studentsCount.total || 0),
        totalNotifications: Number(notificationsCount.total || 0),
        totalFeedback: Number(feedbackCount.total || 0),
        resolvedFeedback: Number(resolvedFeedbackCount.total || 0),
        totalSosAlerts: Number(sosCount.total || 0),
        resolvedSosAlerts: Number(resolvedSosCount.total || 0),
        totalLocations: Number(locationsCount.total || 0),
      },
      activityChart,
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
exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY id DESC');
    res.json({ success: true, total: rows.length, notifications: rows, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách thông báo: ' + error.message });
  }
};

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

exports.updateNotification = async (req, res) => {
  const { id } = req.params;
  const { title, content, type, sender, date } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung thông báo là bắt buộc.' });
  }

  try {
    const notifType = type || 'general';
    const notifSender = sender || 'Phòng Đào Tạo';

    if (date) {
      await db.query(
        'UPDATE notifications SET title = ?, content = ?, type = ?, sender = ?, date = ? WHERE id = ?',
        [title.trim(), content.trim(), notifType, notifSender, date, id]
      );
    } else {
      await db.query(
        'UPDATE notifications SET title = ?, content = ?, type = ?, sender = ? WHERE id = ?',
        [title.trim(), content.trim(), notifType, notifSender, id]
      );
    }

    res.json({
      success: true,
      message: 'Cập nhật thông báo thành công.',
      notification: {
        id: Number(id),
        title: title.trim(),
        content: content.trim(),
        type: notifType,
        sender: notifSender
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo: ' + error.message });
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

exports.updateFeedbackStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const newStatus = status || 'Đã giải quyết';

  try {
    await db.query('UPDATE feedback SET status = ? WHERE id = ?', [newStatus, id]);

    // Bắn sự kiện Realtime qua Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('feedback_status_changed', { id: Number(id), status: newStatus });
      io.emit('stats_update');
    }

    res.json({ success: true, message: `Đã cập nhật trạng thái phản hồi: ${newStatus}`, status: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái phản hồi: ' + error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM feedback WHERE id = ?', [id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('stats_update');
    }

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

exports.updateSosStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const newStatus = status || 'Đã xử lý';

  try {
    await db.query('UPDATE sos_alerts SET status = ? WHERE id = ?', [newStatus, id]);

    // Bắn sự kiện Realtime qua Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('sos_status_changed', { id: Number(id), status: newStatus });
      io.emit('stats_update');
    }

    res.json({ success: true, message: `Đã cập nhật trạng thái cảnh báo SOS: ${newStatus}`, status: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái SOS: ' + error.message });
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

/**
 * 6. Quản lý bản đồ & địa điểm (Campus Map & Locations CRUD)
 */
exports.getLocations = async (req, res) => {
  const search = req.query.search ? `%${req.query.search.trim()}%` : null;
  const category = req.query.category && req.query.category !== 'Tất cả' ? req.query.category.trim() : null;

  try {
    let sql = 'SELECT * FROM map_locations';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR building LIKE ? OR description LIKE ? OR category LIKE ?)');
      params.push(search, search, search, search);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, locations: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách địa điểm: ' + error.message });
  }
};

exports.createLocation = async (req, res) => {
  const { name, category, building, floor, description, lat, lng, icon, color } = req.body;

  if (!name || lat === undefined || lat === null || lng === undefined || lng === null) {
    return res.status(400).json({ success: false, message: 'Tên địa điểm và tọa độ (Vĩ độ lat, Kinh độ lng) là bắt buộc.' });
  }

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return res.status(400).json({ success: false, message: 'Tọa độ lat, lng phải là số thực hợp lệ.' });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO map_locations (name, category, building, floor, description, lat, lng, icon, color, x, y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 50, 50)
    `, [
      name.trim(),
      category ? category.trim() : 'Khác',
      building ? building.trim() : '',
      floor ? floor.trim() : 'Tầng 1',
      description ? description.trim() : '',
      numLat,
      numLng,
      icon || 'map-pin',
      color || '#3B82F6'
    ]);

    const [rows] = await db.query('SELECT * FROM map_locations WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Thêm địa điểm thành công.',
      location: rows[0] || { id: result.insertId, name, lat: numLat, lng: numLng }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi thêm địa điểm: ' + error.message });
  }
};

exports.updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, category, building, floor, description, lat, lng, icon, color } = req.body;

  if (!name || lat === undefined || lat === null || lng === undefined || lng === null) {
    return res.status(400).json({ success: false, message: 'Tên địa điểm và tọa độ (lat, lng) là bắt buộc.' });
  }

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return res.status(400).json({ success: false, message: 'Tọa độ lat, lng phải là số hợp lệ.' });
  }

  try {
    await db.query(`
      UPDATE map_locations 
      SET name = ?, category = ?, building = ?, floor = ?, description = ?, lat = ?, lng = ?, icon = ?, color = ?
      WHERE id = ?
    `, [
      name.trim(),
      category ? category.trim() : 'Khác',
      building ? building.trim() : '',
      floor ? floor.trim() : 'Tầng 1',
      description ? description.trim() : '',
      numLat,
      numLng,
      icon || 'map-pin',
      color || '#3B82F6',
      id
    ]);

    const [rows] = await db.query('SELECT * FROM map_locations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm cần cập nhật.' });
    }

    res.json({
      success: true,
      message: 'Cập nhật địa điểm thành công.',
      location: rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật địa điểm: ' + error.message });
  }
};

exports.deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM map_locations WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa địa điểm thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa địa điểm: ' + error.message });
  }
};

exports.resetLocations = async (req, res) => {
  try {
    const { seedMapLocations } = require('../database/seeders');
    const total = await seedMapLocations(db, { force: true });
    res.json({
      success: true,
      message: `Đã khôi phục thành công ${total} địa điểm mặc định của Trường ĐH Tây Nguyên!`,
      total
    });
  } catch (error) {
    console.error('Lỗi reset địa điểm:', error);
    res.status(500).json({ success: false, message: 'Lỗi khôi phục địa điểm mặc định: ' + error.message });
  }
};

/**
 * 7. Quản lý Mạng lưới đường đi nội bộ khuôn viên (Campus Paths / Walkways)
 */
exports.getPaths = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM campus_paths ORDER BY id ASC');
    const paths = rows.map(r => ({
      ...r,
      coordinates: typeof r.coordinates === 'string' ? JSON.parse(r.coordinates) : r.coordinates
    }));
    res.json({ success: true, count: paths.length, paths });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đường nội bộ: ' + error.message });
  }
};

exports.createPath = async (req, res) => {
  const { name, path_type, coordinates } = req.body;

  // Hỗ trợ cả 1 nhánh [ [lat, lng], ... ] hoặc nhiều nhánh [ [ [lat, lng], ... ], ... ]
  const isSingle = Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0]?.[0] === 'number';
  const isMulti = Array.isArray(coordinates) && coordinates.length >= 1 && Array.isArray(coordinates[0]) && coordinates[0].length >= 2;
  if (!coordinates || (!isSingle && !isMulti)) {
    return res.status(400).json({ success: false, message: 'Tuyến đường cần ít nhất 2 điểm tọa độ [lat, lng].' });
  }

  try {
    const pathName = name ? name.trim() : `Lối đi bộ #${Date.now().toString().slice(-4)}`;
    const [result] = await db.query(
      'INSERT INTO campus_paths (name, path_type, coordinates) VALUES (?, ?, ?)',
      [pathName, path_type || 'walkway', JSON.stringify(coordinates)]
    );

    res.status(201).json({
      success: true,
      message: 'Lưu tuyến đường nội bộ mới thành công.',
      path: {
        id: result.insertId,
        name: pathName,
        path_type: path_type || 'walkway',
        coordinates
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo tuyến đường: ' + error.message });
  }
};

exports.updatePath = async (req, res) => {
  const { id } = req.params;
  const { name, path_type, coordinates } = req.body;

  const isSingle = Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0]?.[0] === 'number';
  const isMulti = Array.isArray(coordinates) && coordinates.length >= 1 && Array.isArray(coordinates[0]) && coordinates[0].length >= 2;
  if (!coordinates || (!isSingle && !isMulti)) {
    return res.status(400).json({ success: false, message: 'Tuyến đường cần ít nhất 2 điểm tọa độ.' });
  }

  try {
    await db.query(
      'UPDATE campus_paths SET name = ?, path_type = ?, coordinates = ? WHERE id = ?',
      [name ? name.trim() : 'Lối đi nội bộ', path_type || 'walkway', JSON.stringify(coordinates), id]
    );

    res.json({
      success: true,
      message: 'Cập nhật tuyến đường thành công.',
      path: { id: Number(id), name, path_type, coordinates }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật tuyến đường: ' + error.message });
  }
};

exports.deletePath = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM campus_paths WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa tuyến đường nội bộ thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa tuyến đường: ' + error.message });
  }
};

exports.resetPaths = async (req, res) => {
  try {
    const { seedCampusPaths } = require('../database/seeders');
    const total = await seedCampusPaths(db, { force: true });
    res.json({
      success: true,
      message: `Đã khôi phục ${total} tuyến đường nội bộ mặc định của trường!`,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khôi phục đường nội bộ: ' + error.message });
  }
};

