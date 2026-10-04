const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const db = require('../config/db');

/**
 * Auth Service - Xử lý nghiệp vụ xác thực người dùng
 */
const AuthService = {
  /**
   * Tạo token phiên làm việc
   */
  generateToken(user) {
    return `jwt-token-${user.id}-${user.email || user.mssv}-${Date.now()}`;
  },

  /**
   * Xác thực đăng nhập
   */
  async authenticateUser(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Vui lòng nhập tài khoản và mật khẩu.');
    }

    const trimmedId = identifier.trim();
    const user = await UserModel.findByIdentifier(trimmedId);

    if (!user) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác.');
    }

    let isMatch = false;

    // Kiểm tra bcrypt hash
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Hỗ trợ mật khẩu dạng cũ (plaintext) và nâng cấp tự động
      isMatch = (user.password === password);
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (!isMatch) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác.');
    }

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPass } = user;

    return {
      user: userWithoutPass,
      token
    };
  },

  /**
   * Đăng ký tài khoản sinh viên mới
   */
  async registerStudent({ mssv, fullName, email, password }) {
    const existing = await UserModel.findByMssv(mssv);
    if (existing) {
      throw new Error('Mã số sinh viên đã tồn tại trên hệ thống.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = await UserModel.create({
      mssv,
      fullName: fullName || `Sinh viên ${mssv}`,
      email: email || `${mssv}@sv.ttn.edu.vn`,
      password: hashedPassword,
      role: 'sinh_vien'
    });

    const newUser = await UserModel.findById(userId);
    const token = this.generateToken(newUser);
    const { password: _, ...userWithoutPass } = newUser;

    return {
      user: userWithoutPass,
      token
    };
  }
};

module.exports = AuthService;
