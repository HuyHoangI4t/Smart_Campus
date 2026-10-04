const pool = require('./db');
const bcrypt = require('bcryptjs');

/**
 * Khởi tạo và đồng bộ cấu trúc các bảng cơ sở dữ liệu MySQL (smartcampus)
 * Tối ưu hóa, chuẩn hóa tên cột tiếng Việt, loại bỏ toàn bộ các trường trùng lặp/dư thừa.
 */
async function initializeTables() {
  try {
    const connection = await pool.getConnection();

    // 1. Bảng users (Tài khoản người dùng: sinh viên, giảng viên, admin)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) UNIQUE NOT NULL,
        ho_ten VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'sinh_vien',
        so_dien_thoai VARCHAR(50) DEFAULT '',
        lop VARCHAR(100) DEFAULT 'Kỹ thuật phần mềm K23',
        khoa VARCHAR(100) DEFAULT 'Công nghệ Thông tin',
        avatar LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dọn dẹp trường cũ (full_name, phone, ngay_sinh, gioi_tinh) nếu chạy trên cơ sở dữ liệu cũ
    try {
      const [userCols] = await connection.query(`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      `);
      const existingColNames = userCols.map((c) => c.COLUMN_NAME.toLowerCase());

      if (existingColNames.includes('full_name')) {
        await connection.query(`UPDATE users SET ho_ten = full_name WHERE (ho_ten IS NULL OR ho_ten = '') AND full_name IS NOT NULL`);
        await connection.query(`ALTER TABLE users DROP COLUMN full_name`);
        console.log('✔ Đã loại bỏ cột trùng lặp full_name từ bảng users');
      }
      if (existingColNames.includes('phone')) {
        await connection.query(`UPDATE users SET so_dien_thoai = phone WHERE (so_dien_thoai IS NULL OR so_dien_thoai = '') AND phone IS NOT NULL`);
        await connection.query(`ALTER TABLE users DROP COLUMN phone`);
        console.log('✔ Đã loại bỏ cột trùng lặp phone từ bảng users');
      }
      if (existingColNames.includes('ngay_sinh')) {
        await connection.query(`ALTER TABLE users DROP COLUMN ngay_sinh`);
        console.log('✔ Đã loại bỏ cột ngay_sinh từ bảng users');
      }
      if (existingColNames.includes('gioi_tinh')) {
        await connection.query(`ALTER TABLE users DROP COLUMN gioi_tinh`);
        console.log('✔ Đã loại bỏ cột gioi_tinh từ bảng users');
      }
      if (existingColNames.includes('course_year')) {
        await connection.query(`ALTER TABLE users DROP COLUMN course_year`);
        console.log('✔ Đã loại bỏ cột course_year từ bảng users');
      }
    } catch (cleanErr) {
      // Bỏ qua nếu không cần dọn dẹp
    }

    // 2. Bảng feedback (Ý kiến phản hồi của sinh viên)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Bảng sos_alerts (Báo động khẩn cấp SOS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50),
        location VARCHAR(255),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Bảng map_locations (Bản đồ các địa điểm trong khuôn viên trường)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS map_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Bảng notifications (Thông báo nhà trường)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        sender VARCHAR(100) DEFAULT 'Phòng Đào Tạo',
        date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Bảng surveys (Phiếu khảo sát sinh viên)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Đang mở',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Bảng support_tickets (Yêu cầu trợ giúp học tập / kỹ thuật)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Đang xử lý',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Bảng password_resets (Quản lý mã OTP & Token khôi phục mật khẩu)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Bảng registration_otps (Quản lý mã OTP xác thực đăng ký)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registration_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        ho_ten VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Bảng student_grades (Bảng kết quả học tập chuẩn hóa)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        ma_hp VARCHAR(50) DEFAULT '',
        ten_hp VARCHAR(255) NOT NULL,
        nam_hoc VARCHAR(20) DEFAULT NULL,
        ky VARCHAR(20) DEFAULT NULL,
        diem_dbp DECIMAL(4,2) DEFAULT NULL,
        diem_thi1 DECIMAL(4,2) DEFAULT NULL,
        diem_thi2 DECIMAL(4,2) DEFAULT NULL,
        diem_1 DECIMAL(4,2) DEFAULT NULL,
        diem_2 DECIMAL(4,2) DEFAULT NULL,
        diem_chu VARCHAR(10) DEFAULT NULL,
        so_tin_chi DECIMAL(3,1) DEFAULT NULL,
        hoc_phi VARCHAR(100) DEFAULT NULL,
        hoc_ky VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(mssv)
      )
    `);

    // 11. Bảng student_schedules (Thời khóa biểu học tập của sinh viên)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        ma_hp VARCHAR(50) DEFAULT '',
        ten_hp VARCHAR(255) NOT NULL,
        thu VARCHAR(20) NOT NULL,
        tiet VARCHAR(50) NOT NULL,
        phong VARCHAR(50) NOT NULL,
        giang_vien VARCHAR(100),
        hoc_ky VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(mssv)
      )
    `);

    // 12. Tự động chèn tài khoản mẫu ban đầu cho máy mới (Seed Data)
    const [userRows] = await connection.query('SELECT COUNT(*) AS total FROM users');
    if (userRows[0].total === 0) {
      const salt = await bcrypt.genSalt(10);
      const defaultStudentPass = await bcrypt.hash('123456', salt);
      const defaultAdminPass = await bcrypt.hash('admin123', salt);


      // Tài khoản Quản trị viên (Admin)
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

      console.log('✔ Đã khởi tạo tài khoản Admin (admin/admin123)');
    }

    console.log('✅ Khởi tạo cơ sở dữ liệu (smartcampus) hoàn tất và chuẩn hóa thành công.');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo bảng cơ sở dữ liệu:', error.message);
  }
}

module.exports = initializeTables;