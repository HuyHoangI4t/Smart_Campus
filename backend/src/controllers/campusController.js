// Campus & Utility Controller - Handled Feedback, SOS and Map locations
const db = require('../config/db');

// Helper to get mssv from request
const getMssvFromReq = (req) => {
  if (req.body && req.body.mssv) return req.body.mssv;
  if (req.body && req.body.msv) return req.body.msv;
  if (req.query && req.query.mssv) return req.query.mssv;
  if (req.query && req.query.msv) return req.query.msv;
  if (req.headers['x-mssv']) return req.headers['x-mssv'];
  if (req.headers['x-masv']) return req.headers['x-masv'];

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token.startsWith('jwt-token-')) {
      const parts = token.split('-');
      if (parts.length >= 3 && parts[2]) {
        return parts[2];
      }
    }
    if (token && !token.includes(' ') && token.length <= 15) {
      return token;
    }
  }

  return 'Anonymous';
};

// Submit Feedback
exports.submitFeedback = async (req, res) => {
  const { title, content, category, rating } = req.body;
  const mssv = getMssvFromReq(req);

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung phản hồi là bắt buộc.' });
  }

  try {
    const feedbackTitle = category ? `[${category}] ${title}` : title;
    await db.query(
      'INSERT INTO feedback (mssv, title, content) VALUES (?, ?, ?)',
      [mssv, feedbackTitle, content]
    );

    res.json({
      success: true,
      message: 'Gửi phản hồi thành công! Cảm ơn ý kiến đóng góp của bạn.',
      feedback: {
        mssv,
        title: feedbackTitle,
        content,
        category: category || 'Chung',
        rating: rating || 5,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    res.status(500).json({ success: false, message: 'Lỗi lưu phản hồi: ' + error.message, error: error.message });
  }
};

// Submit SOS
exports.submitSos = async (req, res) => {
  const { location, message, description, incidentType } = req.body;
  const mssv = getMssvFromReq(req);
  const sosLocation = location || 'Không rõ vị trí trong khuôn viên trường';
  const alertMsg = incidentType ? `[${incidentType}] ${description || message || 'Yêu cầu hỗ trợ khẩn cấp'}` : (description || message || 'Yêu cầu hỗ trợ khẩn cấp');

  try {
    await db.query(
      'INSERT INTO sos_alerts (mssv, location, message) VALUES (?, ?, ?)',
      [mssv, sosLocation, alertMsg]
    );

    res.json({
      success: true,
      message: 'Đã gửi tín hiệu SOS khẩn cấp thành công. Đội an ninh và y tế đã nhận được vị trí!',
      alert: {
        mssv,
        location: sosLocation,
        message: alertMsg,
        incidentType: incidentType || 'Khẩn cấp',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error in submitSos:', error);
    res.status(500).json({ success: false, message: 'Lỗi gửi tín hiệu SOS: ' + error.message, error: error.message });
  }
};

// Get Map Locations (với đầy đủ danh mục và phân tầng)
exports.getMapLocations = async (req, res) => {
  const CATEGORIES = ["Tất cả", "Giảng đường", "Học tập", "Phòng máy", "Dịch vụ", "Y tế", "Tiện ích", "Hành chính", "Ký túc xá"];

  try {
    const [rows] = await db.query('SELECT * FROM map_locations ORDER BY id ASC');
    if (rows && rows.length >= 37) {
      return res.json({
        success: true,
        categories: CATEGORIES,
        locations: rows
      });
    }

    // Nếu chưa đủ 37 điểm, chạy seed lại
    const seeder = require('../database/seed_37_locations');
    const [freshRows] = await db.query('SELECT * FROM map_locations ORDER BY id ASC');
    return res.json({
      success: true,
      categories: CATEGORIES,
      locations: freshRows
    });
  } catch (error) {
    console.error('Error in getMapLocations:', error);
    try {
      const [rows] = await db.query('SELECT * FROM map_locations ORDER BY id ASC');
      return res.json({ success: true, categories: CATEGORIES, locations: rows || [] });
    } catch {
      return res.status(500).json({ success: false, message: 'Lỗi tải danh sách địa điểm bản đồ' });
    }
  }
};

// Cấu hình danh mục Feedback
exports.getFeedbackConfig = (req, res) => {
  res.json({
    success: true,
    categories: [
      "Cơ sở vật chất",
      "Chất lượng giảng dạy",
      "Căng tin & Dịch vụ",
      "An ninh & Gửi xe",
      "Thủ tục sinh viên",
      "Khác",
    ],
    defaultRating: 5
  });
};

// Cấu hình hotline và danh mục sự cố SOS
exports.getSosConfig = (req, res) => {
  res.json({
    success: true,
    hotlines: [
      { label: "Bảo vệ & An ninh cơ sở (Huy Hoàng)", phone: "0329106783", icon: "shield" },
      { label: "Trạm Y tế sinh viên (Duyên)", phone: "0978269097", icon: "plus-circle" },
      { label: "Cấp cứu 115 (Xuân Hoàng)", phone: "0326896303", icon: "phone-call" },
      { label: "Cứu hỏa PCCC 114 (Kiên)", phone: "0968372005", icon: "alert-octagon" },
    ],
    incidentTypes: [
      "Cần hỗ trợ y tế",
      "Sự cố an ninh / va chạm",
      "Chập điện / Hỏa hoạn",
      "Kẹt thang máy",
      "Khác",
    ]
  });
};

// Unified Home Dashboard API
exports.getDashboard = async (req, res) => {
  const mssv = getMssvFromReq(req);
  try {
    const isRealStudent = mssv && mssv !== 'Anonymous' && mssv !== 'guest';

    // Chạy song song tất cả các truy vấn DB bằng Promise.all (tăng tốc độ 4x)
    const [uResult, notifResult, fbResult, sosResult] = await Promise.all([
      isRealStudent ? db.query('SELECT mssv, ho_ten, email, lop, khoa FROM users WHERE mssv = ? LIMIT 1', [mssv]) : Promise.resolve([[]]),
      db.query('SELECT id, title, content, type, sender, date, created_at FROM notifications ORDER BY id DESC LIMIT 10'),
      isRealStudent ? db.query('SELECT id, title, content, status, created_at FROM feedback WHERE mssv = ? ORDER BY id DESC LIMIT 1', [mssv]) : Promise.resolve([[]]),
      isRealStudent ? db.query('SELECT id, location, message, status, created_at FROM sos_alerts WHERE mssv = ? ORDER BY id DESC LIMIT 1', [mssv]) : Promise.resolve([[]]),
    ]);

    const uRows = uResult[0] || [];
    const notifRows = notifResult[0] || [];
    const userFeedback = (fbResult[0] && fbResult[0][0]) || null;
    const userSos = (sosResult[0] && sosResult[0][0]) || null;

    let studentInfo = { mssv: mssv || '', ho_ten: 'Sinh viên' };
    if (uRows.length > 0) {
      studentInfo = {
        mssv: uRows[0].mssv,
        ho_ten: uRows[0].ho_ten || 'Sinh viên',
        email: uRows[0].email,
        lop: uRows[0].lop,
        khoa: uRows[0].khoa
      };
    }

    const formatDateStr = (dateObj) => {
      if (!dateObj) return '30/9/2026';
      try {
        const d = new Date(dateObj);
        if (isNaN(d.getTime())) return String(dateObj);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      } catch (e) {
        return '30/9/2026';
      }
    };

    const validNotifs = (notifRows || []).filter(n => n.title && n.title.length > 3 && !['d', 'sadsa', 'dấdadsad'].includes(n.title.trim()));

    const notificationAlerts = [];

    // 1. THẺ XANH LÁ (Success - Phản hồi CSVC đã giải quyết hoặc thông báo loại success)
    if (userFeedback) {
      const isResolved = userFeedback.status === 'Đã giải quyết';
      notificationAlerts.push({
        id: `fb-${userFeedback.id}`,
        type: 'feedback',
        variant: isResolved ? 'success' : 'warning',
        icon: isResolved ? 'check' : 'alert-triangle',
        title: isResolved
          ? 'Phản hồi CSVC đã được giải quyết'
          : `Phản hồi: ${userFeedback.title} (${userFeedback.status || 'Đang xử lý'})`,
        subtitle: formatDateStr(userFeedback.created_at),
        date: formatDateStr(userFeedback.created_at),
        status: userFeedback.status || 'Đang xử lý',
        content: userFeedback.content || 'Nội dung phản hồi của bạn đã được ghi nhận.',
        actionScreen: 'feedback'
      });
    } else {
      // Tìm xem có thông báo loại success/resolved từ nhà trường không
      const successNotif = validNotifs.find(n => n.type === 'success' || n.type === 'resolved');
      if (successNotif) {
        notificationAlerts.push({
          id: `notif-${successNotif.id}`,
          type: 'feedback',
          variant: 'success',
          icon: 'check',
          title: successNotif.title,
          subtitle: formatDateStr(successNotif.created_at || successNotif.date),
          date: formatDateStr(successNotif.created_at || successNotif.date),
          status: 'Đã giải quyết',
          content: successNotif.content || successNotif.title,
          sender: successNotif.sender || 'Phòng Quản trị CSVC'
        });
      } else {
        // Mẫu mặc định chuẩn giao diện
        notificationAlerts.push({
          id: 'default-fb',
          type: 'feedback',
          variant: 'success',
          icon: 'check',
          title: 'Phản hồi CSVC đã được giải quyết',
          subtitle: '30/9/2026',
          date: '30/9/2026',
          status: 'Đã giải quyết',
          content: 'Ý kiến phản hồi cơ sở vật chất của bạn đã được phòng kỹ thuật xử lý xong.',
          actionScreen: 'feedback'
        });
      }
    }

    // 2. THẺ VÀNG CAM (Warning - Tín hiệu SOS hoặc Cảnh báo đổi phòng / khẩn cấp)
    if (userSos) {
      notificationAlerts.push({
        id: `sos-${userSos.id}`,
        type: 'sos',
        variant: 'warning',
        icon: 'alert-triangle',
        title: `Tín hiệu SOS: ${userSos.status || 'Đã tiếp nhận & hỗ trợ'}`,
        subtitle: formatDateStr(userSos.created_at),
        date: formatDateStr(userSos.created_at),
        status: userSos.status || 'Đã tiếp nhận',
        content: userSos.message || 'Tín hiệu SOS khẩn cấp tại vị trí của bạn.',
        actionScreen: 'sos'
      });
    } else {
      const warningNotif = validNotifs.find(n => n.type === 'urgent' || n.type === 'warning');
      if (warningNotif) {
        notificationAlerts.push({
          id: `warn-${warningNotif.id}`,
          type: 'sos',
          variant: 'warning',
          icon: 'alert-triangle',
          title: warningNotif.title,
          subtitle: formatDateStr(warningNotif.created_at || warningNotif.date),
          date: formatDateStr(warningNotif.created_at || warningNotif.date),
          status: 'Cảnh báo',
          content: warningNotif.content || warningNotif.title,
          actionScreen: 'schedule'
        });
      } else {
        // Mẫu mặc định chuẩn giao diện
        notificationAlerts.push({
          id: 'default-warning',
          type: 'sos',
          variant: 'warning',
          icon: 'alert-triangle',
          title: 'Thay đổi phòng học môn Lập trình di động',
          subtitle: 'Hôm nay',
          date: 'Hôm nay',
          status: 'Cảnh báo',
          content: 'Học phần Lập trình di động chuyển từ phòng 9.2.04 sang phòng 9.3.01 (Nhà 9).',
          actionScreen: 'schedule'
        });
      }
    }

    // 3. THẺ XANH DƯƠNG (Info - Thông báo chung phát từ trường, bảo trì thư viện...)
    const infoNotif = validNotifs.find(n => n.type !== 'urgent' && n.type !== 'warning' && n.type !== 'success' && n.type !== 'resolved');
    if (infoNotif) {
      notificationAlerts.push({
        id: `notif-${infoNotif.id}`,
        type: 'school_notice',
        variant: 'info',
        icon: 'info',
        title: infoNotif.title,
        subtitle: formatDateStr(infoNotif.created_at || infoNotif.date),
        date: formatDateStr(infoNotif.created_at || infoNotif.date),
        status: infoNotif.type === 'academic' ? 'Học vụ' : 'Thông báo',
        content: infoNotif.content || infoNotif.title,
        sender: infoNotif.sender || 'Ban Giám hiệu'
      });
    } else {
      // Mẫu mặc định chuẩn giao diện
      notificationAlerts.push({
        id: 'default-info',
        type: 'school_notice',
        variant: 'info',
        icon: 'info',
        title: 'Bảo trì hệ thống thư viện',
        subtitle: '30/9/2026',
        date: '30/9/2026',
        status: 'Thông báo',
        content: 'Hệ thống thư viện số và tra cứu giáo trình sẽ tạm ngừng để nâng cấp server từ 22h00.',
        sender: 'Ban Giám hiệu'
      });
    }

    const stats = [
      { label: "Ghế Thư viện", value: "34", sub: "Còn trống", icon: "book-open", color: "#10B981" },
      { label: "Căng tin", value: "8 phút", sub: "Thời gian chờ", icon: "coffee", color: "#F59E0B" },
      { label: "Tiện ích số", value: "24/7", sub: "Hoạt động", icon: "wifi", color: "#3B82F6" },
      { label: "Trạng thái", value: "Bình thường", sub: "Toàn khuôn viên", icon: "check-circle", color: "#8B5CF6" },
    ];

    res.json({
      success: true,
      student: studentInfo,
      alerts: notificationAlerts,
      notificationAlerts,
      stats,
      quickActions: [
        { icon: "navigation", label: "Bản đồ", screen: "map", bg: "#F3F4F6", fg: "#0284C7" },
        { icon: "calendar", label: "Lịch học", screen: "schedule", bg: "#DBEAFE", fg: "#2563EB" },
        { icon: "message-square", label: "Phản hồi", screen: "feedback", bg: "#FEF3C7", fg: "#D97706" },
        { icon: "bar-chart-2", label: "Kết quả", screen: "grades", bg: "#D1FAE5", fg: "#059669" },
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải dashboard: ' + error.message });
  }
};

