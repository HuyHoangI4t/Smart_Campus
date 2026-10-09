const crypto = require('crypto');
const UserModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'smartcampus_secret_key_2026_secure';

/**
 * Middleware xác thực Bearer Token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy Authorization header. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token xác thực không hợp lệ.'
      });
    }

    // Token format: jwt-token-{mssv_or_id}-{timestamp}-{signature?}
    if (token.startsWith('jwt-token-')) {
      const parts = token.split('-');
      const identifier = parts[2];
      const timestamp = parts[3];
      const signature = parts[4];
      
      let user = null;
      if (identifier) {
        user = (await UserModel.findByMssv(identifier)) || (await UserModel.findById(identifier));
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản không tồn tại trên hệ thống.'
        });
      }

      // Xác thực chữ ký số HMAC nếu token được ký
      if (signature) {
        const expectedSig = crypto
          .createHmac('sha256', JWT_SECRET)
          .update(`${identifier}:${user.role || 'sinh_vien'}:${timestamp}`)
          .digest('hex')
          .slice(0, 16);

        if (signature !== expectedSig) {
          return res.status(401).json({
            success: false,
            message: 'Chữ ký token không hợp lệ hoặc đã bị thay đổi.'
          });
        }
      }

      req.user = user;
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Định dạng token không được hỗ trợ.'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
      error: error.message
    });
  }
};

/**
 * Middleware kiểm tra quyền hạn (Role-based Access Control)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực người dùng.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Từ chối truy cập. Yêu cầu quyền: [${roles.join(', ')}].`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
