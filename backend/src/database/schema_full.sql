-- ============================================================================
-- SMART CAMPUS ĐẠI HỌC TÂY NGUYÊN (TTN) - TOÀN BỘ CẤU TRÚC DATABASE (12 BẢNG)
-- ============================================================================
-- File chứa DDL tạo 12 bảng thực tế, toàn bộ cột và CHỈ GIỮ LẠI CÁC INDEX THIẾT YẾU.
-- Không lạm dụng chỉ mục để tiết kiệm bộ nhớ, tăng tốc độ ghi dữ liệu (INSERT/UPDATE).
-- Bảng mã: utf8mb4 / utf8mb4_unicode_ci | Storage Engine: InnoDB
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `smartcampus` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `smartcampus`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. BẢNG users: Tài khoản người dùng (sinh viên, giảng viên, quản trị viên)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `ho_ten` VARCHAR(255) DEFAULT NULL,
  `so_dien_thoai` VARCHAR(50) DEFAULT NULL,
  `lop` VARCHAR(100) DEFAULT 'Kỹ thuật phần mềm K23',
  `khoa` VARCHAR(100) DEFAULT 'Công nghệ Thông tin',
  `role` VARCHAR(50) DEFAULT 'sinh_vien',
  `avatar` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. BẢNG map_locations: Danh mục địa điểm, tòa nhà khuôn viên ĐH Tây Nguyên
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `map_locations` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `building` VARCHAR(100) DEFAULT NULL,
  `floor` VARCHAR(100) DEFAULT NULL,
  `lat` DECIMAL(10, 8) DEFAULT NULL,
  `lng` DECIMAL(11, 8) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `x` INT DEFAULT 50,
  `y` INT DEFAULT 50,
  `type` VARCHAR(50) DEFAULT 'academic',
  `color` VARCHAR(50) DEFAULT '#6366F1',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. BẢNG campus_paths: Các tuyến đường đi bộ nội bộ khuôn viên trường
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campus_paths` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `path_type` VARCHAR(50) DEFAULT 'walkway',
  `coordinates` JSON NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. BẢNG student_schedules: Thời khóa biểu học tập của sinh viên
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_schedules` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) NOT NULL,
  `ma_hp` VARCHAR(50) NOT NULL,
  `ten_hp` VARCHAR(255) NOT NULL,
  `thu` VARCHAR(20) NOT NULL,
  `tiet` VARCHAR(50) NOT NULL,
  `phong` VARCHAR(50) NOT NULL,
  `giang_vien` VARCHAR(100) DEFAULT NULL,
  `hoc_ky` VARCHAR(50) DEFAULT 'HK1 (2025-2026)',
  `is_custom` TINYINT(1) DEFAULT 0,
  `ghi_chu` VARCHAR(255) DEFAULT '',
  `loai_lich` VARCHAR(50) DEFAULT 'chinh_khoa',
  `week_range` VARCHAR(100) DEFAULT NULL,
  `ngay_hoc` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sched_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. BẢNG student_grades: Điểm thi và bảng điểm chi tiết của sinh viên
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_grades` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) NOT NULL,
  `ma_hp` VARCHAR(50) DEFAULT '',
  `ten_hp` VARCHAR(255) NOT NULL,
  `nam_hoc` VARCHAR(20) DEFAULT NULL,
  `ky` VARCHAR(20) DEFAULT NULL,
  `diem_dbp` DECIMAL(4, 2) DEFAULT NULL,
  `diem_qt` DECIMAL(4, 2) DEFAULT NULL,
  `diem_thi1` DECIMAL(4, 2) DEFAULT 8.00,
  `diem_thi2` DECIMAL(4, 2) DEFAULT 8.00,
  `diem_thi` DECIMAL(4, 2) DEFAULT NULL,
  `diem_1` DECIMAL(4, 2) DEFAULT NULL,
  `diem_2` DECIMAL(4, 2) DEFAULT NULL,
  `diem_hp` DECIMAL(4, 2) DEFAULT NULL,
  `diem_chu` VARCHAR(10) DEFAULT 'B',
  `so_tin_chi` DECIMAL(3, 1) DEFAULT 3.0,
  `hoc_phi` VARCHAR(100) DEFAULT NULL,
  `hoc_ky` VARCHAR(50) DEFAULT 'HK1 (2025-2026)',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_grades_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. BẢNG news_cache: Bộ nhớ đệm tin tức và thông báo từ cổng trường TTN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `news_cache` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `guid` VARCHAR(255) UNIQUE,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `summary` TEXT DEFAULT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `link` VARCHAR(500) DEFAULT NULL,
  `pub_date` VARCHAR(100) DEFAULT NULL,
  `raw_date` VARCHAR(100) DEFAULT NULL,
  `author` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(255) DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `badge` VARCHAR(100) DEFAULT NULL,
  `badge_color` VARCHAR(50) DEFAULT NULL,
  `source_name` VARCHAR(255) DEFAULT NULL,
  `attachments` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_news_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. BẢNG feedback: Ý kiến phản ánh, đánh giá chất lượng của sinh viên
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'facility',
  `rating` INT DEFAULT 5,
  `status` VARCHAR(50) DEFAULT 'Đã giải quyết',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_feedback_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. BẢNG sos_alerts: Cảnh báo khẩn cấp SOS tới đội bảo vệ/an ninh trường
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sos_alerts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `incident_type` VARCHAR(100) DEFAULT 'Khẩn cấp',
  `status` VARCHAR(50) DEFAULT 'Đã tiếp nhận',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sos_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. BẢNG notifications: Thông báo gửi tới sinh viên và toàn trường
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'info',
  `sender` VARCHAR(100) DEFAULT 'Phòng Đào Tạo',
  `date` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. BẢNG password_resets: Mã OTP và token đặt lại mật khẩu qua email
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pwd_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. BẢNG registration_otps: Mã OTP xác thực đăng ký tài khoản mới
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `registration_otps` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `mssv` VARCHAR(50) NOT NULL,
  `ho_ten` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reg_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. BẢNG activity_logs: Nhật ký hoạt động & tương tác trên ứng dụng
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `mssv` VARCHAR(50) DEFAULT 'guest',
  `ip_address` VARCHAR(50) DEFAULT '',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_act_mssv` (`mssv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
