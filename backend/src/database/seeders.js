/**
 * ============================================================================
 * CÁC HÀM CẬP NHẬT & SEED DỮ LIỆU (SEEDER & DATA UPDATE FUNCTIONS)
 * ============================================================================
 * Tập trung toàn bộ logic cập nhật, nạp dữ liệu ban đầu và bảo trì database:
 * 1. seedAdminUser: Tạo tài khoản Quản trị viên (admin/admin123)
 * 2. seedMapLocations: Cập nhật & nạp 37 địa điểm Đại học Tây Nguyên
 * 3. seedCampusPaths: Nạp các tuyến đường đi bộ nội bộ
 * 4. runAllSeeders: Thực thi tuần tự toàn bộ seeders
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const {
  DEFAULT_ADMIN_USER,
  TAY_NGUYEN_CAMPUS_LOCATIONS,
  DEFAULT_CAMPUS_PATHS,
} = require('./seedData');

/**
 * 1. Seed tài khoản Admin nếu chưa tồn tại
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} conn
 */
async function seedAdminUser(conn) {
  const connection = conn || pool;
  const [adminRows] = await connection.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (adminRows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_USER.passwordPlain, salt);
    await connection.query(
      `INSERT INTO users (mssv, ho_ten, email, password, role, so_dien_thoai, lop, khoa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        DEFAULT_ADMIN_USER.mssv,
        DEFAULT_ADMIN_USER.ho_ten,
        DEFAULT_ADMIN_USER.email,
        passwordHash,
        DEFAULT_ADMIN_USER.role,
        DEFAULT_ADMIN_USER.so_dien_thoai,
        DEFAULT_ADMIN_USER.lop,
        DEFAULT_ADMIN_USER.khoa,
      ]
    );
    console.log(`✔ [Seeder] Đã khởi tạo tài khoản Admin (${DEFAULT_ADMIN_USER.mssv}/${DEFAULT_ADMIN_USER.passwordPlain})`);
  }
}

/**
 * 2. Seed & Cập nhật 37 địa điểm bản đồ khuôn viên trường Đại học Tây Nguyên
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} conn
 * @param {{ force?: boolean }} options
 */
async function seedMapLocations(conn, options = {}) {
  const connection = conn || pool;
  const { force = false } = options;

  const [existing] = await connection.query('SELECT COUNT(*) as total FROM map_locations');
  const count = existing[0]?.total || 0;

  if (count < 37 || force) {
    if (force) {
      await connection.query('DELETE FROM map_locations');
    }

    for (const loc of TAY_NGUYEN_CAMPUS_LOCATIONS) {
      await connection.query(
        `INSERT INTO map_locations (id, name, category, building, floor, description, lat, lng, icon, x, y, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           category = VALUES(category),
           building = VALUES(building),
           floor = VALUES(floor),
           description = VALUES(description),
           lat = VALUES(lat),
           lng = VALUES(lng),
           icon = VALUES(icon),
           x = VALUES(x),
           y = VALUES(y),
           color = VALUES(color)`,
        [
          loc.id,
          loc.name,
          loc.category,
          loc.building,
          loc.floor,
          loc.description,
          loc.lat,
          loc.lng,
          loc.icon,
          loc.x,
          loc.y,
          loc.color,
        ]
      );
    }
    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM map_locations');
    console.log(`✔ [Seeder] Đã đồng bộ ${finalCount[0].total} địa điểm bản đồ ĐH Tây Nguyên.`);
    return finalCount[0].total;
  }
  return count;
}

/**
 * 3. Seed các tuyến đường đi bộ nội bộ trường
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} conn
 * @param {{ force?: boolean }} options
 */
async function seedCampusPaths(conn, options = {}) {
  const connection = conn || pool;
  const { force = false } = options;

  const [existing] = await connection.query('SELECT COUNT(*) as total FROM campus_paths');
  const count = existing[0]?.total || 0;

  if (count === 0 || force) {
    if (force) {
      await connection.query('DELETE FROM campus_paths');
    }
    for (const p of DEFAULT_CAMPUS_PATHS) {
      await connection.query(
        'INSERT INTO campus_paths (name, path_type, coordinates) VALUES (?, ?, ?)',
        [p.name, p.path_type, JSON.stringify(p.coordinates)]
      );
    }
    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM campus_paths');
    console.log(`✔ [Seeder] Đã nạp ${finalCount[0].total} tuyến đường đi bộ nội bộ.`);
    return finalCount[0].total;
  }
  return count;
}

/**
 * 4. Chạy toàn bộ các seeder
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} connection
 */
async function runAllSeeders(connection) {
  await seedAdminUser(connection);
  await seedMapLocations(connection);
  await seedCampusPaths(connection);
}

module.exports = {
  seedAdminUser,
  seedMapLocations,
  seedCampusPaths,
  runAllSeeders,
};

// Cho phép chạy trực tiếp từ Terminal: node src/database/seeders.js
if (require.main === module) {
  (async () => {
    try {
      const conn = await pool.getConnection();
      console.log('🚀 Đang chạy Seeders trực tiếp...');
      await runAllSeeders(conn);
      conn.release();
      console.log('🎉 Hoàn thành chạy seeders.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Lỗi khi chạy seeders:', err);
      process.exit(1);
    }
  })();
}

