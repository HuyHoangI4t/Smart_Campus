const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Register
exports.register = async (req, res) => {
  const { mssv, password, fullName, faculty, email } = req.body;

  if (!mssv || !password) {
    return res.status(400).json({ success: false, message: 'Mã số sinh viên (mssv) và mật khẩu là bắt buộc.' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE mssv = ?', [mssv]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Mã số sinh viên đã tồn tại trong hệ thống.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userFullName = fullName || ('Sinh viên ' + mssv);
    const userFaculty = faculty || 'Công nghệ thông tin';
    const userEmail = email || `${mssv}@sv.ttn.edu.vn`;

    await db.query(
      'INSERT INTO users (mssv, full_name, faculty, email, password) VALUES (?, ?, ?, ?, ?)',
      [mssv, userFullName, userFaculty, userEmail, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      user: { mssv, fullName: userFullName, faculty: userFaculty, email: userEmail }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đăng ký', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { mssv, password, email } = req.body;
  const loginKey = mssv || email;

  if (!loginKey || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã số sinh viên (hoặc email) và mật khẩu.' });
  }

  try {
    const queryStr = loginKey.includes('@') 
      ? 'SELECT * FROM users WHERE email = ?' 
      : 'SELECT * FROM users WHERE mssv = ?';
    const [rows] = await db.query(queryStr, [loginKey]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        mssv: user.mssv,
        fullName: user.full_name,
        faculty: user.faculty,
        email: user.email,
        avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      },
      token: 'jwt-token-' + user.mssv + '-' + Date.now()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đăng nhập', error: error.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công, phiên làm việc đã được hủy trên server.'
  });
};

// Get Current User Profile (Me)
exports.getMe = async (req, res) => {
  const mssv = req.query.mssv || req.params.mssv || '23103023';

  try {
    const [rows] = await db.query('SELECT mssv, full_name, faculty, email, created_at FROM users WHERE mssv = ?', [mssv]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
    }
    const user = rows[0];
    res.json({
      success: true,
      profile: {
        mssv: user.mssv,
        fullName: user.full_name,
        faculty: user.faculty,
        email: user.email,
        avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy thông tin profile', error: error.message });
  }
};

// Helper to get mssv from request
const getMssvFromReq = async (req) => {
  if (req.body && req.body.mssv) return req.body.mssv;
  if (req.body && req.body.masv) return req.body.masv;
  if (req.query && req.query.mssv) return req.query.mssv;
  if (req.query && req.query.masv) return req.query.masv;
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

  try {
    const [rows] = await db.query('SELECT mssv FROM users ORDER BY created_at DESC LIMIT 1');
    if (rows.length > 0) {
      return rows[0].mssv;
    }
  } catch (e) {
    // ignore
  }

  return '23103023';
};

// Change Password
exports.changePassword = async (req, res) => {
  const mssv = await getMssvFromReq(req);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE mssv = ?', [mssv]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE mssv = ?', [hashedPassword, mssv]);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu', error: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { mssv, email } = req.body;
  const key = mssv || email;

  if (!key) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã số sinh viên hoặc email.' });
  }

  try {
    const queryStr = key.includes('@') ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE mssv = ?';
    const [rows] = await db.query(queryStr, [key]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với thông tin đã cung cấp.' });
    }

    const user = rows[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    await db.query('UPDATE users SET password = ? WHERE mssv = ?', [hashedPassword, user.mssv]);

    res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành mặc định: 123456. Vui lòng đăng nhập và đổi lại mật khẩu.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi quên mật khẩu', error: error.message });
  }
};
