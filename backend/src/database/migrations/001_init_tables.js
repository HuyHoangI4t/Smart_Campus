/**
 * Migration 001: Khởi tạo schema 11 bảng chuẩn hóa của Smart Campus TTN
 */
async function up(connection) {
  // 1. users
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

  // 2. feedback
  await connection.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Đã giải quyết',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. sos_alerts
  await connection.query(`
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50),
      location VARCHAR(255),
      message TEXT,
      status VARCHAR(50) DEFAULT 'Đã tiếp nhận & hỗ trợ',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. map_locations
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

  // 5. notifications
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

  // 6. surveys
  await connection.query(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Đang mở',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. support_tickets
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

  // 8. password_resets
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

  // 9. registration_otps
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

  // 10. student_grades
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

  // 11. student_schedules
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

  // 12. news_cache (Bộ nhớ đệm tin tức & thông báo từ TTN)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS news_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guid VARCHAR(255) UNIQUE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      summary TEXT,
      content LONGTEXT,
      link VARCHAR(500),
      pub_date VARCHAR(100),
      raw_date VARCHAR(100),
      author VARCHAR(255),
      category VARCHAR(255),
      image_url VARCHAR(500),
      badge VARCHAR(100),
      badge_color VARCHAR(50),
      source_name VARCHAR(255),
      attachments JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX(type),
      INDEX(created_at)
    )
  `);

  // Tối ưu hóa chỉ mục (Indexes) để tăng tốc độ truy vấn đọc/ghi DB lên tối đa
  const safeAddIndex = async (table, col, indexName) => {
    try {
      await connection.query(`ALTER TABLE ${table} ADD INDEX ${indexName} (${col})`);
    } catch (e) {
      // index already exists or ignore
    }
  };

  await safeAddIndex('feedback', 'mssv', 'idx_feedback_mssv');
  await safeAddIndex('sos_alerts', 'mssv', 'idx_sos_mssv');
  await safeAddIndex('student_grades', 'mssv', 'idx_student_grades_mssv');
  await safeAddIndex('student_schedules', 'mssv', 'idx_student_schedules_mssv');
  await safeAddIndex('news_cache', 'type', 'idx_news_cache_type');
}

module.exports = { up };
