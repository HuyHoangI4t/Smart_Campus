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
          console.log(`+ Added column ${col.name} to users table`);
        } catch (e) {
          console.warn(`Could not add column ${col.name}:`, e.message);
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

    // 10. Student Grades table (Bảng điểm thực tế lưu trong Database)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mssv VARCHAR(50) NOT NULL,
        ma_hp VARCHAR(50) NOT NULL,
        ten_hp VARCHAR(255) NOT NULL,
        so_tin_chi INT DEFAULT 3,
        diem_qt DECIMAL(4,2) DEFAULT 8.0,
        diem_th DECIMAL(4,2) DEFAULT 8.0,
        diem_thi DECIMAL(4,2) DEFAULT 8.0,
        diem_hp DECIMAL(4,2) DEFAULT 8.0,
        diem_chu VARCHAR(5) DEFAULT 'B',
        hoc_ky VARCHAR(50) DEFAULT 'HK1 (2025-2026)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(mssv)
      )
    `);

    // 11. Student Schedules table (Lịch học thực tế lưu trong Database)
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
        hoc_ky VARCHAR(50) DEFAULT 'HK1 (2025-2026)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(mssv)
      )
    `);

    // Seed default grades for 23103023 if not exist
    const [existingGrades] = await connection.query('SELECT COUNT(*) as count FROM student_grades WHERE mssv = ?', ['23103023']);
    if (existingGrades[0].count === 0) {
      await connection.query(`
        INSERT INTO student_grades (mssv, ma_hp, ten_hp, so_tin_chi, diem_qt, diem_th, diem_thi, diem_hp, diem_chu, hoc_ky) VALUES
        ('23103023', 'NT118', 'Lập trình thiết bị di động', 3, 9.5, 9.0, 8.5, 8.9, 'A', 'HK1 (2025-2026)'),
        ('23103023', 'CS301', 'Cấu trúc dữ liệu & Giải thuật', 4, 8.5, 8.5, 8.0, 8.3, 'B+', 'HK1 (2025-2026)'),
        ('23103023', 'IT202', 'Hệ cơ sở dữ liệu', 3, 8.0, 8.5, 8.0, 8.1, 'B+', 'HK1 (2025-2026)'),
        ('23103023', 'NT101', 'Mạng máy tính nâng cao', 3, 9.0, 9.5, 9.0, 9.2, 'A+', 'HK1 (2025-2026)'),
        ('23103023', 'ENG201', 'Tiếng Anh chuyên ngành', 2, 8.0, 7.5, 7.8, 7.8, 'B', 'HK1 (2025-2026)')
      `);
      console.log('🌱 Seeded student_grades for 23103023');
    }

    // Seed default schedule for 23103023 if not exist
    const [existingSchedule] = await connection.query('SELECT COUNT(*) as count FROM student_schedules WHERE mssv = ?', ['23103023']);
    if (existingSchedule[0].count === 0) {
      await connection.query(`
        INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky) VALUES
        ('23103023', 'CS301', 'Cấu trúc dữ liệu & Giải thuật', 'Thứ 2', '1 - 3', 'ENG-B204', 'ThS. Nguyễn Văn A', 'HK1 (2025-2026)'),
        ('23103023', 'NT118', 'Lập trình thiết bị di động', 'Thứ 2', '4 - 6', 'LAB-03', 'TS. Trần Thị B', 'HK1 (2025-2026)'),
        ('23103023', 'IT202', 'Hệ cơ sở dữ liệu', 'Thứ 3', '7 - 9', 'ENG-A102', 'ThS. Lê Hoàng C', 'HK1 (2025-2026)'),
        ('23103023', 'NT101', 'Mạng máy tính & Truyền thông', 'Thứ 4', '1 - 3', 'NET-LAB', 'TS. Phạm Văn D', 'HK1 (2025-2026)'),
        ('23103023', 'NT205', 'An toàn thông tin mạng', 'Thứ 5', '4 - 6', 'ENG-B301', 'ThS. Vũ Thị E', 'HK1 (2025-2026)'),
        ('23103023', 'NT300', 'Đồ án chuyên ngành CNTT', 'Thứ 6', '1 - 4', 'ENG-B101', 'Hội đồng bộ môn', 'HK1 (2025-2026)')
      `);
      console.log('🌱 Seeded student_schedules for 23103023');
    }

    // Seed lecturer account giangvien123 (Mật khẩu: 123456)
    const hashLecturerPass = await bcrypt.hash('123456', 10);
    const [existingLecturer] = await connection.query('SELECT * FROM users WHERE mssv = ?', ['giangvien123']);
    if (existingLecturer.length === 0) {
      await connection.query(`
        INSERT INTO users (mssv, full_name, ho_ten, email, password, role, lop, khoa, so_dien_thoai, phone, avatar) VALUES
        ('giangvien123', 'ThS. Nguyễn Văn Giảng Viên', 'ThS. Nguyễn Văn Giảng Viên', 'giangvien123@ttn.edu.vn', ?, 'giangvien', 'Bộ môn Kỹ thuật Phần mềm', 'Khoa Công nghệ Thông tin', '0912345678', '0912345678', 'https://cdn-icons-png.flaticon.com/512/3410/3410150.png')
      `, [hashLecturerPass]);
      console.log('🌱 Seeded lecturer account: giangvien123 / 123456');
    } else {
      await connection.query(`
        UPDATE users SET password = ?, role = 'giangvien', ho_ten = 'ThS. Nguyễn Văn Giảng Viên', full_name = 'ThS. Nguyễn Văn Giảng Viên', lop = 'Bộ môn Kỹ thuật Phần mềm', khoa = 'Khoa Công nghệ Thông tin' WHERE mssv = 'giangvien123'
      `, [hashLecturerPass]);
      console.log('🔄 Updated lecturer account: giangvien123 / 123456');
    }

    // Seed teaching schedule for giangvien123
    const [existingLecturerSchedule] = await connection.query('SELECT COUNT(*) as count FROM student_schedules WHERE mssv = ?', ['giangvien123']);
    if (existingLecturerSchedule[0].count === 0) {
      await connection.query(`
        INSERT INTO student_schedules (mssv, ma_hp, ten_hp, thu, tiet, phong, giang_vien, hoc_ky) VALUES
        ('giangvien123', 'NT118', 'Lập trình thiết bị di động (Lớp K23)', 'Thứ 2', '1 - 3', 'LAB-03', 'ThS. Nguyễn Văn Giảng Viên', 'HK1 (2025-2026)'),
        ('giangvien123', 'CS301', 'Cấu trúc dữ liệu & Giải thuật (Lớp K22)', 'Thứ 3', '4 - 6', 'ENG-B204', 'ThS. Nguyễn Văn Giảng Viên', 'HK1 (2025-2026)'),
        ('giangvien123', 'IT202', 'Hệ cơ sở dữ liệu (Lớp K23 - KTPM)', 'Thứ 4', '1 - 3', 'ENG-A102', 'ThS. Nguyễn Văn Giảng Viên', 'HK1 (2025-2026)'),
        ('giangvien123', 'NT300', 'Đồ án chuyên ngành CNTT (K21)', 'Thứ 5', '7 - 9', 'ENG-B101', 'ThS. Nguyễn Văn Giảng Viên', 'HK1 (2025-2026)'),
        ('giangvien123', 'NT101', 'Mạng máy tính nâng cao (Lớp K23)', 'Thứ 6', '1 - 4', 'NET-LAB', 'ThS. Nguyễn Văn Giảng Viên', 'HK1 (2025-2026)')
      `);
      console.log('🌱 Seeded teaching schedules for giangvien123');
    }

    console.log('✅ All database tables initialized and verified successfully.');
    connection.release();
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
  }
}

module.exports = initializeTables;
