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

  // CHỈ nạp dữ liệu khi bảng hoàn toàn trống (count === 0) hoặc khi có yêu cầu khôi phục thủ công (force = true).
  // Tuyệt đối KHÔNG tự động nạp lại khi restart backend để bảo vệ các chỉnh sửa tọa độ của Quản trị viên.
  if (count === 0 || force) {
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
 * 4. Seed dữ liệu phản hồi sinh viên mẫu cho tuần hiện tại (nếu bảng trống)
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} conn
 */
async function seedSampleFeedback(conn) {
  const connection = conn || pool;
  const [existing] = await connection.query('SELECT COUNT(*) as total FROM feedback');
  const count = existing[0]?.total || 0;

  if (count === 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    const pad = (n) => String(n).padStart(2, '0');
    const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const sampleFeedbacks = [
      { dayOffset: 0, title: 'Điều hòa phòng B302 bị lỗi quạt gió', content: 'Phòng học B302 quạt gió kêu to và không mát vào tiết 3-4', status: 'Đã giải quyết', mssv: '21103001' },
      { dayOffset: 0, title: 'Đèn bàn học thư viện tầng 2 không sáng', content: 'Khu tự học dãy A có 2 đèn bàn học bị hỏng', status: 'Đã giải quyết', mssv: '21103022' },
      { dayOffset: 1, title: 'Đề xuất mở rộng giờ mở cửa thư viện', content: 'Kính mong nhà trường mở cửa thư viện tới 21h vào đợt thi', status: 'Đang xử lý', mssv: '21103015' },
      { dayOffset: 1, title: 'Bổ sung thêm ổ cắm điện khu tự học dãy C', content: 'Khu tự học dãy C hiện có khá ít ổ cắm cho laptop làm đồ án', status: 'Đã giải quyết', mssv: '22103042' },
      { dayOffset: 2, title: 'Mạng Wifi Giảng đường A2 chập chờn', content: 'Wifi sinh viên kết nối được nhưng tải tài liệu rất chậm', status: 'Đang xử lý', mssv: '21103088' },
      { dayOffset: 3, title: 'Cần sửa vòi nước tầng 3 khu B', content: 'Vòi nước bồn rửa tay bị rò rỉ nước liên tục', status: 'Đã giải quyết', mssv: '23103011' },
      { dayOffset: 3, title: 'Thắc mắc về lịch thi kết thúc học phần', content: 'Xin thông báo chi tiết ca thi và phòng thi bổ sung', status: 'Đã tiếp nhận', mssv: '22103067' },
      { dayOffset: 4, title: 'Đèn chiếu sáng hành lang khu E bị hỏng', content: 'Hành lang tầng 2 khu E buổi tối rất tối, nguy hiểm cho sinh viên', status: 'Đã giải quyết', mssv: '21103099' },
      { dayOffset: 4, title: 'Đăng ký vé xe tháng cho sinh viên K24', content: 'Thủ tục đăng ký vé giữ xe tháng tại nhà xe trung tâm', status: 'Đã tiếp nhận', mssv: '24103005' },
      { dayOffset: 5, title: 'Góp ý về bãi giữ xe cổng số 2', content: 'Giờ tan học cao điểm bãi xe bị ùn ứ, đề xuất mở thêm làn ra', status: 'Đã tiếp nhận', mssv: '22103112' }
    ];

    for (const fb of sampleFeedbacks) {
      const fbDate = new Date(monday);
      fbDate.setDate(monday.getDate() + fb.dayOffset);
      const timeStr = `${toDateKey(fbDate)} 09:${pad(10 + fb.dayOffset * 4)}:00`;
      await connection.query(
        'INSERT INTO feedback (mssv, title, content, status, created_at) VALUES (?, ?, ?, ?, ?)',
        [fb.mssv, fb.title, fb.content, fb.status, timeStr]
      );
    }
    console.log(`✔ [Seeder] Đã nạp ${sampleFeedbacks.length} phản ánh sinh viên mẫu.`);
    return sampleFeedbacks.length;
  }
  return count;
}

/**
 * 5. Seed dữ liệu nhật ký hoạt động / tương tác mẫu cho tuần hiện tại (nếu bảng trống)
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} conn
 */
async function seedSampleActivityLogs(conn, options = {}) {
  const connection = conn || pool;
  const { force = false } = options;
  const [existing] = await connection.query('SELECT COUNT(*) as total FROM activity_logs');
  const count = existing[0]?.total || 0;

  if (count < 50 || force) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    const pad = (n) => String(n).padStart(2, '0');
    const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const countsPerDay = [128, 192, 245, 215, 280, 162, 98];
    const actions = [
      'GET /api/schedule',
      'GET /api/map/locations',
      'GET /api/news',
      'POST /api/auth/login',
      'GET /api/users/profile',
      'GET /api/notifications',
      'GET /api/campus/directions'
    ];
    const mssvList = ['21103001', '21103015', '22103042', '21103088', '23103011', 'guest'];

    const values = [];
    for (let day = 0; day < 7; day++) {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + day);
      // Không tạo dữ liệu cho các ngày tương lai chưa diễn ra
      if (targetDate > now) continue;

      const dayKey = toDateKey(targetDate);
      const totalForDay = countsPerDay[day];

      for (let k = 0; k < totalForDay; k++) {
        const hour = pad(7 + Math.floor(Math.random() * 14));
        const minute = pad(Math.floor(Math.random() * 60));
        const second = pad(Math.floor(Math.random() * 60));
        const createdAt = `${dayKey} ${hour}:${minute}:${second}`;
        const act = actions[Math.floor(Math.random() * actions.length)];
        const mssv = mssvList[Math.floor(Math.random() * mssvList.length)];
        values.push([act, mssv, '127.0.0.1', createdAt]);
      }
    }

    if (values.length > 0) {
      await connection.query(
        'INSERT INTO activity_logs (action, mssv, ip_address, created_at) VALUES ?',
        [values]
      );
      console.log(`✔ [Seeder] Đã nạp ${values.length} bản ghi nhật ký hoạt động mẫu cho tuần hiện tại.`);
      return values.length;
    }
  }
  return count;
}

/**
 * 6. Seed dữ liệu cảnh báo cứu hộ SOS mẫu cho tuần hiện tại (nếu bảng trống)
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} conn
 */
async function seedSampleSosAlerts(conn, options = {}) {
  const connection = conn || pool;
  const { force = false } = options;
  const [existing] = await connection.query('SELECT COUNT(*) as total FROM sos_alerts');
  const count = existing[0]?.total || 0;

  if (count === 0 || force) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    const pad = (n) => String(n).padStart(2, '0');
    const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const sampleSos = [
      { dayOffset: 0, mssv: '21103001', location: 'Nhà thi đấu TDTT', message: 'Trượt chân ngã trật khớp cổ chân khi đá bóng, cần hỗ trợ y tế', incident_type: 'Y tế / Tai nạn', status: 'Đã xử lý' },
      { dayOffset: 0, mssv: '21103015', location: 'Toà nhà C - Tầng 3', message: 'Kẹt cửa thang máy toà C tầng 3, có 4 sinh viên bên trong', incident_type: 'Sự cố hạ tầng', status: 'Đã xử lý' },
      { dayOffset: 1, mssv: '22103042', location: 'Thư viện trung tâm - Tầng 2', message: 'Sinh viên bị hạ đường huyết ngất xỉu tại bàn học', incident_type: 'Y tế / Cấp cứu', status: 'Đã xử lý' },
      { dayOffset: 2, mssv: '21103088', location: 'Khu tự học Nhà B', message: 'Phát hiện khói và mùi khét bốc lên từ ổ cắm điện máy chiếu', incident_type: 'Cháy nổ / An toàn', status: 'Đã xử lý' },
      { dayOffset: 2, mssv: '23103011', location: 'Khuôn viên hồ nước', message: 'Để quên ba lô có laptop và giấy tờ trên ghế đá, cần check camera', incident_type: 'An ninh trật tự', status: 'Đang xử lý' },
      { dayOffset: 2, mssv: '21103001', location: 'Nhà xe sinh viên cổng 2', message: 'Bị rơi chìa khóa xe máy xuống cống thoát nước', incident_type: 'Khẩn cấp khác', status: 'Đã xử lý' },
      { dayOffset: 3, mssv: '22103042', location: 'Giảng đường A1 - Phòng 204', message: 'Đèn trần bị chập nổ tia lửa điện nguy hiểm', incident_type: 'Sự cố hạ tầng', status: 'Đã xử lý' },
      { dayOffset: 4, mssv: '21103015', location: 'Sân bóng rổ ngoài trời', message: 'Xô xát to tiếng giữa nhóm sinh viên, cần bảo vệ can thiệp', incident_type: 'An ninh trật tự', status: 'Đã xử lý' },
      { dayOffset: 4, mssv: '21103088', location: 'Ký túc xá B4 - Phòng 302', message: 'Bị kẹt khóa cửa phòng không ra ngoài được để đi thi', incident_type: 'Khẩn cấp khác', status: 'Đang xử lý' },
      { dayOffset: 5, mssv: '23103011', location: 'Căn tin trung tâm', message: 'Dị ứng thực phẩm nổi mề đay khó thở, cần chuyển trạm y tế', incident_type: 'Y tế / Cấp cứu', status: 'Đã xử lý' }
    ];

    for (const item of sampleSos) {
      const sosDate = new Date(monday);
      sosDate.setDate(monday.getDate() + item.dayOffset);
      if (sosDate > now) continue; // Bỏ qua nếu là ngày tương lai

      const timeStr = `${toDateKey(sosDate)} 10:${pad(15 + item.dayOffset * 3)}:00`;
      await connection.query(
        'INSERT INTO sos_alerts (mssv, location, message, incident_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [item.mssv, item.location, item.message, item.incident_type, item.status, timeStr]
      );
    }
    console.log(`✔ [Seeder] Đã nạp ${sampleSos.length} bản ghi cảnh báo SOS mẫu cho tuần hiện tại.`);
    return sampleSos.length;
  }
  return count;
}

/**
 * 7. Chạy toàn bộ các seeder hệ thống ban đầu
 * (Chỉ nạp tài khoản Admin quản trị và dữ liệu bản đồ địa điểm thực tế, KHÔNG nạp dữ liệu mẫu)
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} connection
 */
async function runAllSeeders(connection) {
  await seedAdminUser(connection);
  await seedMapLocations(connection);
  await seedCampusPaths(connection);
  // Không tự động nạp dữ liệu mẫu (feedback, activity logs, sos alerts)
}

module.exports = {
  seedAdminUser,
  seedMapLocations,
  seedCampusPaths,
  seedSampleFeedback,
  seedSampleActivityLogs,
  seedSampleSosAlerts,
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

