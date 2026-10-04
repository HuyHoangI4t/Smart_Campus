const bcrypt = require('bcryptjs');

/**
 * Seeder ban đầu: Đảm bảo tài khoản Quản trị viên (Admin) luôn tồn tại
 */
async function run(connection) {
  const [adminRows] = await connection.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  if (adminRows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const defaultAdminPass = await bcrypt.hash('admin123', salt);
    await connection.query(`
      INSERT INTO users (mssv, ho_ten, email, password, role, so_dien_thoai, lop, khoa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin',
      'Quản trị viên Hệ thống',
      'admin@ttn.edu.vn',
      defaultAdminPass,
      'admin',
      '0901234567',
      'Ban Quản trị',
      'Phòng Đào tạo'
    ]);
    console.log('✔ [Seeder] Đã khởi tạo tài khoản Admin (admin/admin123)');
  }
}

module.exports = { run };
