 const pool = require('../config/db');
const migration001 = require('./migrations/001_init_tables');
const initialSeeder = require('./seeders/initialSeeder');

/**
 * Điều phối thực thi Migrations và Seeders khi khởi động server
 */
async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Chạy migrations
    await migration001.up(connection);

    // 2. Chạy seeders
    await initialSeeder.run(connection);

    console.log('✅ [Database] Khởi tạo cấu trúc schema và seeder thành công.');
  } catch (error) {
    console.error('❌ [Database] Lỗi khi chạy migration/seeder:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initializeDatabase };
