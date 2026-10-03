const pool = require('./db');
const bcrypt = require('bcryptjs');

async function initializeTables() {
  try {
    const connection = await pool.getConnection();

    // 1. Users table (using mssv)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        ho_ten VARCHAR(255),
        email VARCHAR(255),
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'sinh_vien',
        phone VARCHAR(50),
        so_dien_thoai VARCHAR(50),
        lop VARCHAR(100) DEFAULT 'Kỹ thuật phần mềm K23',
        khoa VARCHAR(100) DEFAULT 'Công nghệ Thông tin',
        ngay_sinh VARCHAR(50) DEFAULT '2005-05-15',
        gioi_tinh VARCHAR(20) DEFAULT 'Nam',
        avatar VARCHAR(255) DEFAULT 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all columns exist in users table
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);
    const existingColNames = cols.map((c) => c.COLUMN_NAME.toLowerCase());

    const userColumns = [
      { name: 'ho_ten', def: 'VARCHAR(255)' },
      { name: 'full_name', def: 'VARCHAR(255)' },
      { name: 'phone', def: 'VARCHAR(50)' },
      { name: 'so_dien_thoai', def: 'VARCHAR(50)' },
      { name: 'lop', def: "VARCHAR(100) DEFAULT ''" },
      { name: 'khoa', def: "VARCHAR(100) DEFAULT ''" },
      { name: 'role', def: "VARCHAR(50) DEFAULT 'sinh_vien'" },
      { name: 'avatar', def: "VARCHAR(255) DEFAULT 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" },
    ];

    for (const col of userColumns) {
      if (!existingColNames.includes(col.name.toLowerCase())) {
        try {
          await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
          console.log(`+ Thêm cột ${col.name} vào bảng users`);
        } catch (e) {
          console.warn(`Không thể thêm cột ${col.name}:`, e.message);
        }
      }
    }

    // Sync ho_ten <-> full_name & phone <-> so_dien_thoai
    await connection.query(`UPDATE users SET ho_ten = full_name WHERE (ho_ten IS NULL OR ho_ten = '') AND full_name IS NOT NULL`);
    await connection.query(`UPDATE users SET full_name = ho_ten WHERE (full_name IS NULL OR full_name = '') AND ho_ten IS NOT NULL`);
    await connection.query(`UPDATE users SET so_dien_thoai = phone WHERE (so_dien_thoai IS NULL OR so_dien_thoai = '') AND phone IS NOT NULL`);
    await connection.query(`UPDATE users SET phone = so_dien_thoai WHERE (phone IS NULL OR phone = '') AND so_dien_thoai IS NOT NULL`);

    // 2. Feedback table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. SOS alerts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50),
        location VARCHAR(255),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Map locations table
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

    // 5. Notifications table
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

    // 6. Surveys table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Đang mở',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Support tickets table
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

    // 8. Password resets table
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

    // 9. Registration pending otps table
    await connection.query(`
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

    // 10. Student Grades table (Tương ứng chuẩn 100% với bảng kết quả đào tạo chính quy của trường)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        ma_hp VARCHAR(50) NOT NULL,
        ten_hp VARCHAR(255) NOT NULL,
        nam_hoc VARCHAR(20) DEFAULT NULL,
        ky VARCHAR(20) DEFAULT NULL,
        diem_dbp DECIMAL(4,2) DEFAULT NULL,
        diem_thi1 DECIMAL(4,2) DEFAULT NULL,
        diem_thi2 DECIMAL(4,2) DEFAULT NULL,
        diem_1 DECIMAL(4,2) DEFAULT NULL,
        diem_2 DECIMAL(4,2) DEFAULT NULL,
        diem_chu VARCHAR(10) DEFAULT 'X',
        so_tin_chi DECIMAL(3,1) DEFAULT NULL,
        hoc_phi VARCHAR(100) DEFAULT NULL,
        hoc_ky VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(mssv)
      )
    `);

    // Đảm bảo đầy đủ các cột chuẩn tương ứng với cổng web trường
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN nam_hoc VARCHAR(20) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN ky VARCHAR(20) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN diem_dbp DECIMAL(4,2) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN diem_thi1 DECIMAL(4,2) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN diem_thi2 DECIMAL(4,2) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN diem_1 DECIMAL(4,2) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN diem_2 DECIMAL(4,2) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN diem_chu VARCHAR(10) DEFAULT 'X'"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN so_tin_chi DECIMAL(3,1) DEFAULT 3.0"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN hoc_phi VARCHAR(100) DEFAULT NULL"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades ADD COLUMN hoc_ky VARCHAR(50) DEFAULT NULL"); } catch (e) {}

    // Xóa triệt để các trường cũ không cần thiết / không tồn tại trong bảng trường
    try { await connection.query("ALTER TABLE student_grades DROP COLUMN diem_th"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades DROP COLUMN diem_thi"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades DROP COLUMN diem_qt"); } catch (e) {}
    try { await connection.query("ALTER TABLE student_grades DROP COLUMN diem_hp"); } catch (e) {}

    // 11. Student Schedules table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        ma_hp VARCHAR(50) NOT NULL,
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

    console.log('✅ Kết nối và khởi tạo các bảng cơ sở dữ liệu thành công.');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo bảng cơ sở dữ liệu:', error.message);
  }
}

module.exports = initializeTables;