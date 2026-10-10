/**
 * ============================================================================
 * ĐỊNH NGHĨA TẤT CẢ CÁC BẢNG TRONG CƠ SỞ DỮ LIỆU (DATABASE SCHEMAS)
 * ============================================================================
 * Toàn bộ cấu trúc 13 bảng của hệ thống Smart Campus Đại học Tây Nguyên
 * được tập trung tại file duy nhất này để dễ dàng quản trị, bảo trì và kiểm soát.
 */

// Định nghĩa mã SQL DDL cho từng bảng
const TABLE_DEFINITIONS = {
  // 1. Bảng người dùng & tài khoản sinh viên/admin
  users: `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 2. Bảng địa điểm bản đồ khuôn viên trường (37 điểm tòa nhà, phòng thi, phòng TN)
  map_locations: `
    CREATE TABLE IF NOT EXISTS map_locations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NULL,
      building VARCHAR(100) NULL,
      floor VARCHAR(100) NULL,
      description TEXT NULL,
      lat DECIMAL(10,8) NULL,
      lng DECIMAL(11,8) NULL,
      icon VARCHAR(50) NULL,
      x INT NULL DEFAULT 50,
      y INT NULL DEFAULT 50,
      type VARCHAR(50) DEFAULT 'academic',
      color VARCHAR(50) NULL DEFAULT '#6366F1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 3. Bảng các tuyến đường đi bộ nội bộ trường Đại học Tây Nguyên
  campus_paths: `
    CREATE TABLE IF NOT EXISTS campus_paths (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      path_type VARCHAR(50) DEFAULT 'walkway',
      coordinates JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 4. Bảng thời khóa biểu học tập của sinh viên (chính khóa + đột xuất/học bù tự tạo)
  student_schedules: `
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
      is_custom TINYINT(1) DEFAULT 0,
      ghi_chu VARCHAR(255) DEFAULT '',
      loai_lich VARCHAR(50) DEFAULT 'chinh_khoa',
      week_range VARCHAR(100) DEFAULT NULL,
      ngay_hoc VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sched_mssv (mssv)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 5. Bảng điểm thi & kết quả học tập của sinh viên
  student_grades: `
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
      INDEX idx_grades_mssv (mssv)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 6. Bảng bộ nhớ đệm tin tức & thông báo nhà trường từ cổng TTN
  news_cache: `
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
      INDEX idx_news_type (type),
      INDEX idx_news_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 7. Bảng ý kiến phản hồi / góp ý của sinh viên
  feedback: `
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'facility',
      rating INT DEFAULT 5,
      status VARCHAR(50) DEFAULT 'Đã giải quyết',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_feedback_mssv (mssv)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 8. Bảng cảnh báo khẩn cấp SOS tới an ninh trường
  sos_alerts: `
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50),
      location VARCHAR(255),
      message TEXT,
      incident_type VARCHAR(100) DEFAULT 'Khẩn cấp',
      status VARCHAR(50) DEFAULT 'Đã tiếp nhận',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sos_mssv (mssv)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 9. Bảng thông báo toàn trường
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      sender VARCHAR(100) DEFAULT 'Phòng Đào Tạo',
      date VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 10. Bảng khảo sát ý kiến sinh viên
  surveys: `
    CREATE TABLE IF NOT EXISTS surveys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Đang mở',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 11. Bảng yêu cầu hỗ trợ sinh viên
  support_tickets: `
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Đang xử lý',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 12. Bảng mã OTP và token đặt lại mật khẩu qua email
  password_resets: `
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pwd_mssv (mssv)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 13. Bảng mã OTP xác thực đăng ký tài khoản mới
  registration_otps: `
    CREATE TABLE IF NOT EXISTS registration_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mssv VARCHAR(50) NOT NULL,
      ho_ten VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reg_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 14. Bảng nhật ký hoạt động & lượt tương tác hệ thống
  activity_logs: `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      mssv VARCHAR(50) DEFAULT 'guest',
      ip_address VARCHAR(50) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_act_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

/**
 * Thêm cột một cách an toàn (bỏ qua nếu cột đã tồn tại)
 */
async function safeAddColumn(connection, table, col, colDef) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${colDef}`);
  } catch {
    // Đã tồn tại cột, bỏ qua
  }
}

/**
 * Thêm Index một cách an toàn (bỏ qua nếu index đã tồn tại)
 */
async function safeAddIndex(connection, table, col, indexName) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD INDEX ${indexName} (${col})`);
  } catch {
    // Đã tồn tại index, bỏ qua
  }
}

/**
 * Hàm khởi tạo tất cả các bảng và cập nhật cột di trú
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} connection
 */
async function createAllTables(connection) {
  for (const [tableName, query] of Object.entries(TABLE_DEFINITIONS)) {
    await connection.query(query);
  }

  // Đồng bộ các cột bổ sung cho trường hợp database cũ đã tạo trước đó
  await safeAddColumn(connection, 'map_locations', 'building', 'VARCHAR(100) NULL');
  await safeAddColumn(connection, 'map_locations', 'floor', 'VARCHAR(100) NULL');
  await safeAddColumn(connection, 'map_locations', 'icon', 'VARCHAR(50) NULL');
  await safeAddColumn(connection, 'map_locations', 'x', 'INT NULL DEFAULT 50');
  await safeAddColumn(connection, 'map_locations', 'y', 'INT NULL DEFAULT 50');
  await safeAddColumn(connection, 'map_locations', 'type', "VARCHAR(50) DEFAULT 'academic'");
  await safeAddColumn(connection, 'map_locations', 'color', 'VARCHAR(50) NULL DEFAULT "#6366F1"');
  await safeAddColumn(connection, 'student_schedules', 'is_custom', 'TINYINT(1) DEFAULT 0');
  await safeAddColumn(connection, 'student_schedules', 'ghi_chu', 'VARCHAR(255) DEFAULT ""');
  await safeAddColumn(connection, 'student_schedules', 'loai_lich', 'VARCHAR(50) DEFAULT "chinh_khoa"');
  await safeAddColumn(connection, 'student_schedules', 'week_range', 'VARCHAR(100) NULL');
  await safeAddColumn(connection, 'student_schedules', 'ngay_hoc', 'VARCHAR(20) NULL');
  await safeAddColumn(connection, 'feedback', 'category', "VARCHAR(50) DEFAULT 'facility'");
  await safeAddColumn(connection, 'feedback', 'rating', 'INT DEFAULT 5');
  await safeAddColumn(connection, 'sos_alerts', 'incident_type', "VARCHAR(100) DEFAULT 'Khẩn cấp'");

  // Đảm bảo các chỉ mục tăng tốc truy vấn
  await safeAddIndex(connection, 'feedback', 'mssv', 'idx_feedback_mssv');
  await safeAddIndex(connection, 'sos_alerts', 'mssv', 'idx_sos_mssv');
  await safeAddIndex(connection, 'student_grades', 'mssv', 'idx_student_grades_mssv');
  await safeAddIndex(connection, 'student_schedules', 'mssv', 'idx_student_schedules_mssv');
  await safeAddIndex(connection, 'student_schedules', 'week_range', 'idx_sched_week_range');
  await safeAddIndex(connection, 'student_schedules', 'ngay_hoc', 'idx_sched_ngay_hoc');
  await safeAddIndex(connection, 'news_cache', 'type', 'idx_news_cache_type');
  await safeAddIndex(connection, 'activity_logs', 'created_at', 'idx_act_created');
}

module.exports = {
  TABLE_DEFINITIONS,
  createAllTables,
  safeAddColumn,
  safeAddIndex,
};

