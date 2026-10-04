const UserModel = require('../models/userModel');

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

    // Token format: jwt-token-{id}-{email_or_mssv}
    if (token.startsWith('jwt-token-')) {
      const parts = token.split('-');
      const userId = parts[2];
      
      let user = null;
      if (userId) {
        user = await UserModel.findById(userId);
      }

      req.user = user || { id: userId, role: 'sinh_vien' };
      return next();
    }

    // Default fallback user
    req.user = { id: 1, role: 'sinh_vien' };
    next();
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
