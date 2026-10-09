/**
 * ============================================================================
 * TRUNG TÂM ĐIỀU PHỐI CƠ SỞ DỮ LIỆU (DATABASE ROOT ORCHESTRATOR)
 * ============================================================================
 * - tables.js: 1 file duy nhất chứa toàn bộ DDL định nghĩa các bảng
 * - seedData.js: 1 file duy nhất chứa toàn bộ dữ liệu mẫu / hằng số tĩnh
 * - seeders.js: 1 file duy nhất chứa toàn bộ hàm cập nhật, seeder và bảo trì
 */

const pool = require('../config/db');
const { createAllTables, TABLE_DEFINITIONS, safeAddColumn, safeAddIndex } = require('./tables');
const {
  seedAdminUser,
  seedMapLocations,
  seedCampusPaths,
  seedSampleFeedback,
  seedSampleActivityLogs,
  runAllSeeders
} = require('./seeders');
const seedData = require('./seedData');

/**
 * Điều phối khởi tạo toàn bộ Database khi Server khởi động:
 * 1. Tạo và cập nhật cấu trúc tất cả các bảng (tables.js)
 * 2. Nạp dữ liệu sẵn ban đầu (seeders.js)
 */
async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Khởi tạo schema tất cả các bảng
    await createAllTables(connection);

    // 2. Chạy seeders & đồng bộ dữ liệu sẵn
    await runAllSeeders(connection);

    console.log('✅ [Database] Khởi tạo cấu trúc schema và dữ liệu sẵn thành công.');
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
  seedSampleFeedback,
  seedSampleActivityLogs,
  runAllSeeders,
  ...seedData,
};

// Cho phép chạy trực tiếp từ Terminal: node src/database/index.js
if (require.main === module) {
  initializeDatabase().then(() => {
    process.exit(0);
  });
}
