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

// Get Map Locations
exports.getMapLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM map_locations');
    if (rows.length === 0) {
      const defaultLocations = [
        ['Tòa A Kỹ thuật', 21.002, 105.801, 'Khu giảng đường khối kỹ thuật, công nghệ thông tin'],
        ['Thư viện trung tâm', 21.004, 105.803, 'Khu tự học, tra cứu tài liệu, kho sách điện tử'],
        ['Căng tin sinh viên', 21.001, 105.805, 'Khu vực dịch vụ ăn uống, giải khát'],
        ['Tòa nhà Hiệu bộ (Admin)', 21.005, 105.802, 'Phòng Đào tạo, Công tác sinh viên, Tài vụ'],
        ['Khoa Khoa học Sức khỏe', 21.003, 105.806, 'Phòng thực hành y dược, điều dưỡng'],
        ['Khu Thể thao & Nhà thi đấu', 21.006, 105.807, 'Sân bóng đá, bóng rổ, cầu lông'],
        ['Trung tâm CNTT & Labs', 21.002, 105.804, 'Phòng máy thực hành, Trung tâm Dữ liệu Server']
      ];

      for (const loc of defaultLocations) {
        await db.query('INSERT INTO map_locations (name, lat, lng, description) VALUES (?, ?, ?, ?)', loc);
      }
      const [seededRows] = await db.query('SELECT * FROM map_locations');
      return res.json({ success: true, locations: seededRows });
    }
    res.json({ success: true, locations: rows });
  } catch (error) {
    console.error('Error in getMapLocations:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy bản đồ: ' + error.message, error: error.message });
  }
};

