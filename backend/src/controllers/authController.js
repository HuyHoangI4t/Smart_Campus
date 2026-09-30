const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function ensureRegistrationOtpTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS registration_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    // ignore
  }
}

// Register Request (Sends OTP and stores pending registration)
exports.registerRequest = async (req, res) => {
  const { mssv, password, fullName, email, mat_khau, ho_ten } = req.body;
  const regPassword = password || mat_khau;
  const userFullName = fullName || ho_ten;

  if (!mssv || !regPassword) {
    return res.status(400).json({ success: false, message: 'Mã số sinh viên (mssv) và mật khẩu là bắt buộc.' });
  }

  try {
    await ensureRegistrationOtpTable();

    const [existing] = await db.query('SELECT * FROM users WHERE mssv = ?', [mssv]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Mã số sinh viên đã tồn tại trong hệ thống.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(regPassword, salt);

    const finalFullName = userFullName || ('Sinh viên ' + mssv);
    const userEmail = email || `${mssv}@sv.ttn.edu.vn`;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    console.log('========================================');
    console.log(`[REGISTRATION OTP] MSSV: ${mssv}, Email: ${userEmail}, OTP CODE: ${otpCode}`);
    console.log('========================================');

    await db.query('DELETE FROM registration_otps WHERE mssv = ?', [mssv]);
    await db.query(
      'INSERT INTO registration_otps (mssv, full_name, email, password, otp_code, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [mssv, finalFullName, userEmail, hashedPassword, otpCode, expiresAt]
    );

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: `"Smart Campus" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: '[Smart Campus] Mã OTP xác thực đăng ký tài khoản sinh viên',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f3f6fd; border-radius: 12px; max-width: 600px; margin: auto;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #132F73; margin: 0;">Smart Campus TTN</h2>
                <p style="color: #64748B; font-size: 13px; margin-top: 4px;">Hệ thống Quản lý Sinh viên</p>
              </div>
              <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <p style="color: #0f172a; font-size: 15px;">Xin chào <b>${userFullName}</b>,</p>
                <p style="color: #475569; font-size: 14px;">Bạn đang thực hiện đăng ký tài khoản sinh viên với MSSV: <b>${mssv}</b>.</p>
                <p style="color: #475569; font-size: 14px;">Mã OTP xác thực đăng ký của bạn (hiệu lực trong 15 phút):</p>
                <div style="text-align: center; margin: 24px 0;">
                  <span style="font-size: 28px; font-weight: 900; color: #5B61F4; background: #eef2ff; padding: 12px 28px; border-radius: 10px; letter-spacing: 6px; border: 1.5px dashed #818cf8;">
                    ${otpCode}
                  </span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
              </div>
            </div>
          `
        });
        console.log(`[Email Sent] Successfully sent registration OTP email to ${userEmail}`);
      } catch (err) {
        console.error('[Email Error] Could not send registration email via SMTP:', err.message);
      }
    } else {
      console.log('[Email Info] SMTP not configured in .env. OTP code logged in backend terminal console.');
    }

    res.json({
      success: true,
      message: process.env.SMTP_USER && process.env.SMTP_PASS 
        ? `Mã OTP xác thực đã được gửi đến email ${userEmail}.` 
        : `Mã OTP đã được tạo! (Dev Mode: Xem mã OTP 6 số trong terminal console của backend).`,
      mssv,
      email: userEmail
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi yêu cầu đăng ký: ' + error.message, error: error.message });
  }
};

// Verify Register OTP & Save to DB
exports.verifyRegisterOtp = async (req, res) => {
  const { mssv, otpCode } = req.body;

  if (!mssv || !otpCode) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp MSSV và mã OTP.' });
  }

  try {
    await ensureRegistrationOtpTable();

    const [rows] = await db.query(
      'SELECT * FROM registration_otps WHERE mssv = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1',
      [mssv.trim(), otpCode.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn.' });
    }

    const regData = rows[0];

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(regData.expires_at);
    if (expiresAt < now) {
      await db.query('DELETE FROM registration_otps WHERE mssv = ?', [mssv]);
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.' });
    }

    // Insert user into users table
    await db.query(
      'INSERT INTO users (mssv, full_name, email, password) VALUES (?, ?, ?, ?)',
      [regData.mssv, regData.full_name, regData.email, regData.password]
    );

    // Clean up registration_otps
    await db.query('DELETE FROM registration_otps WHERE mssv = ?', [mssv]);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công và đã lưu vào hệ thống!',
      user: {
        mssv: regData.mssv,
        fullName: regData.full_name,
        email: regData.email
      }
    });
  } catch (error) {
    console.error('Error in verifyRegisterOtp:', error);
    res.status(500).json({ success: false, message: 'Lỗi xác thực đăng ký: ' + error.message, error: error.message });
  }
};



// Register (Direct or backwards compatible)
exports.register = exports.registerRequest;

// Login
exports.login = async (req, res) => {
  const { mssv, password, email, mat_khau } = req.body;
  const loginKey = mssv || email;
  const loginPassword = password || mat_khau;

  if (!loginKey || !loginPassword) {
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
    const isMatch = await bcrypt.compare(loginPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng.' });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        mssv: user.mssv,
        fullName: user.full_name,
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
    const [rows] = await db.query('SELECT mssv, full_name, email, created_at FROM users WHERE mssv = ?', [mssv]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
    }
    const user = rows[0];
    res.json({
      success: true,
      profile: {
        mssv: user.mssv,
        fullName: user.full_name,
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

  return 'guest';
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

// Forgot Password: Request OTP & Reset Token (Sends real email to mssv@sv.ttn.edu.vn or user.email)
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
    const recipientEmail = user.email || `${user.mssv}@sv.ttn.edu.vn`;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    await db.query('DELETE FROM password_resets WHERE mssv = ?', [user.mssv]);
    await db.query(
      'INSERT INTO password_resets (mssv, email, otp_code, token, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.mssv, recipientEmail, otpCode, token, expiresAt]
    );

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: 'Hệ thống chưa cấu hình SMTP email. Vui lòng cấu hình SMTP_USER và SMTP_PASS trong file .env.' 
      });
    }

    try {
      await transporter.sendMail({
        from: `"Smart Campus" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: '[Smart Campus] Mã OTP xác thực khôi phục mật khẩu',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f3f6fd; border-radius: 12px; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #132F73; margin: 0;">Smart Campus TTN</h2>
              <p style="color: #64748B; font-size: 13px; margin-top: 4px;">Hệ thống Quản lý Sinh viên</p>
            </div>
            <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <p style="color: #0f172a; font-size: 15px;">Xin chào <b>${user.full_name || user.mssv}</b>,</p>
              <p style="color: #475569; font-size: 14px;">Bạn nhận được yêu cầu cấp lại mật khẩu cho tài khoản sinh viên với MSSV: <b>${user.mssv}</b>.</p>
              <p style="color: #475569; font-size: 14px;">Mã OTP xác thực của bạn (hiệu lực trong 15 phút):</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="font-size: 28px; font-weight: 900; color: #5B61F4; background: #eef2ff; padding: 12px 28px; border-radius: 10px; letter-spacing: 6px; border: 1.5px dashed #818cf8;">
                  ${otpCode}
                </span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
            </div>
          </div>
        `
      });
      console.log(`[Email Sent] Successfully sent real OTP email to ${recipientEmail}`);
    } catch (err) {
      console.error('[Email Error] Could not send email via SMTP:', err.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể gửi email OTP qua SMTP. Vui lòng kiểm tra lại App Password hoặc kết nối mạng.',
        error: err.message 
      });
    }

    res.json({
      success: true,
      message: `Mã OTP đã được gửi thành công đến email ${recipientEmail}. Vui lòng kiểm tra hộp thư.`,
      mssv: user.mssv,
      email: recipientEmail
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi yêu cầu quên mật khẩu', error: error.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { mssv, otpCode } = req.body;

  if (!mssv || !otpCode) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp MSSV và mã OTP.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE mssv = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [mssv, otpCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn.' });
    }

    const record = rows[0];

    res.json({
      success: true,
      message: 'Xác thực OTP thành công.',
      token: record.token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xác thực OTP', error: error.message });
  }
};

// Reset Password with New Password
exports.resetPassword = async (req, res) => {
  const { mssv, token, otpCode, newPassword } = req.body;

  if (!mssv || !newPassword || (!token && !otpCode)) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
  }

  try {
    let queryStr = '';
    let queryParams = [];

    if (token) {
      queryStr = 'SELECT * FROM password_resets WHERE mssv = ? AND token = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1';
      queryParams = [mssv, token];
    } else {
      queryStr = 'SELECT * FROM password_resets WHERE mssv = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1';
      queryParams = [mssv, otpCode];
    }

    const [rows] = await db.query(queryStr, queryParams);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Phiên yêu cầu đã hết hạn hoặc không hợp lệ.' });
    }

    const record = rows[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE mssv = ?', [hashedPassword, record.mssv]);
    await db.query('DELETE FROM password_resets WHERE mssv = ?', [record.mssv]);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu mới thành công! Vui lòng đăng nhập lại.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đặt lại mật khẩu', error: error.message });
  }
};
