/**
 * ============================================================================
 * TRUNG TÂM ĐIỀU PHỐI CƠ SỞ DỮ LIỆU (DATABASE ROOT ORCHESTRATOR)
 * ============================================================================
 * - tables.js: 1 file duy nhất chứa toàn bộ DDL định nghĩa các bảng
 * - seedData.js: 1 file duy nhất chứa toàn bộ dữ liệu mẫu / hằng số tĩnh
 * - seeders.js: 1 file duy nhất chứa toàn bộ hàm cập nhật, seeder và bảo trì
 */

const mysql = require('mysql2/promise');
const pool = require('../config/db');
const { createAllTables, TABLE_DEFINITIONS, safeAddColumn, safeAddIndex } = require('./tables');
const {
  seedAdminUser,
  seedMapLocations,
  seedCampusPaths,
  runAllSeeders
} = require('./seeders');
const seedData = require('./seedData');

/**
 * Đảm bảo Database tồn tại trong MySQL trước khi kết nối pool
 */
async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'smartcampus';
  let tempConn;
  try {
    tempConn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT) || 3306,
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  } catch (err) {
    // Bỏ qua lỗi nếu database đã tồn tại hoặc tài khoản root không có quyền tạo schema
  } finally {
    if (tempConn) {
      try { await tempConn.end(); } catch {}
    }
  }
}

/**
 * Điều phối khởi tạo toàn bộ Database khi Server khởi động:
 * 0. Đảm bảo Database đã tồn tại (CREATE DATABASE IF NOT EXISTS)
 * 1. Tạo và cập nhật cấu trúc tất cả các bảng (tables.js)
 * 2. Nạp dữ liệu sẵn ban đầu và dữ liệu mẫu (seeders.js)
 */
async function initializeDatabase() {
  await ensureDatabaseExists();
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Khởi tạo schema tất cả các bảng
    await createAllTables(connection);

    // 2. Chạy seeders & đồng bộ dữ liệu sẵn / dữ liệu mẫu
    await runAllSeeders(connection);

    console.log('✅ [Database] Khởi tạo cấu trúc schema và dữ liệu nền tảng thành công.');
  } catch (error) {
    console.error('❌ [Database] Lỗi khi khởi tạo schema / seeder:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  initializeDatabase,
  createAllTables,
  TABLE_DEFINITIONS,
  safeAddColumn,
  safeAddIndex,
  seedAdminUser,
  seedMapLocations,
  seedCampusPaths,
  runAllSeeders,
  ...seedData,
};

// Cho phép chạy trực tiếp từ Terminal: node src/database/index.js
if (require.main === module) {
  initializeDatabase().then(() => {
    process.exit(0);
  });
}
