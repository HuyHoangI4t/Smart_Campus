const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Các tuyến đường nội bộ mặc định ban đầu của Trường Đại học Tây Nguyên
const DEFAULT_CAMPUS_PATHS = [
  {
    name: "Đường Trục Chính: Cổng Lê Duẩn - Khu Hiệu Bộ - Nhà 2",
    path_type: "main_road",
    coordinates: [
      [12.65155, 108.02495], // Cổng chính Lê Duẩn
      [12.65125, 108.02455], // Ngã ba trước Thư viện & Hội trường A
      [12.65090, 108.02410], // Tòa Hiệu Bộ (Nhà điều hành)
      [12.65072, 108.02431], // Nhà học số 2
    ]
  },
  {
    name: "Lối Đi Bộ: Nhà 2 - Nhà 5 - Bệnh Viện Trường",
    path_type: "walkway",
    coordinates: [
      [12.65072, 108.02431], // Nhà học số 2
      [12.65045, 108.02410], // Lối giao thoa sân trong
      [12.65005, 108.02383], // Nhà học số 5 (Khoa Y Dược)
      [12.65015, 108.02340], // Hành lang nối sang Bệnh viện
      [12.65035, 108.02312], // Bệnh viện Đại học Tây Nguyên
    ]
  },
  {
    name: "Tuyến Đường: Khu Hiệu Bộ - Thư Viện - Căng Tin Trung Tâm",
    path_type: "walkway",
    coordinates: [
      [12.65090, 108.02410], // Tòa Hiệu Bộ
      [12.65125, 108.02455], // Ngã ba trung tâm
      [12.65150, 108.02480], // Đường Thư viện
      [12.65170, 108.02490], // Thư viện trung tâm
      [12.65185, 108.02510], // Căng tin trung tâm & Tiện ích
    ]
  },
  {
    name: "Đường Trục Đông: Thư Viện - Nhà 8 - Trung Tâm Kỹ Năng Sư Phạm",
    path_type: "main_road",
    coordinates: [
      [12.65170, 108.02490], // Thư viện
      [12.65180, 108.02560], // Trục đường giảng đường phía Đông
      [12.65190, 108.02640], // Nhà học số 8
      [12.65215, 108.02690], // Đường nội bộ phía sau
      [12.65230, 108.02720], // Trung tâm Kỹ năng Sư phạm
    ]
  },
  {
    name: "Đường Liên Khu: Nhà 8 - Khu Ký Túc Xá - Khu Thể Thao",
    path_type: "walkway",
    coordinates: [
      [12.65190, 108.02640], // Nhà học số 8
      [12.65210, 108.02580], // Lối rẽ vào KTX
      [12.65210, 108.02530], // Khu Ký túc xá sinh viên
      [12.65250, 108.02580], // Đường lên sân bóng
      [12.65280, 108.02680], // Sân vận động & Nhà thi đấu
    ]
  },
  {
    name: "Lối Đi Bộ Phía Nam: Nhà 5 - Khu Thực Hành Nông Lâm",
    path_type: "walkway",
    coordinates: [
      [12.65005, 108.02383], // Nhà học số 5
      [12.64965, 108.02420], // Lối đi phía Nam
      [12.64930, 108.02480], // Vườn thực nghiệm Nông Lâm
    ]
  }
];

async function initCampusPaths() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartcampus',
  });

  console.log('Connected to MySQL. Creating campus_paths table...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS campus_paths (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      path_type VARCHAR(50) DEFAULT 'walkway',
      coordinates JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [existing] = await conn.query('SELECT COUNT(*) as count FROM campus_paths');
  if (existing[0].count === 0) {
    console.log('Seeding initial campus paths...');
    for (const p of DEFAULT_CAMPUS_PATHS) {
      await conn.query(
        'INSERT INTO campus_paths (name, path_type, coordinates) VALUES (?, ?, ?)',
        [p.name, p.path_type, JSON.stringify(p.coordinates)]
      );
    }
    console.log(`Seeded ${DEFAULT_CAMPUS_PATHS.length} initial campus paths.`);
  } else {
    console.log(`Table campus_paths already has ${existing[0].count} paths.`);
  }

  await conn.end();
}

module.exports = {
  DEFAULT_CAMPUS_PATHS,
  initCampusPaths
};

if (require.main === module) {
  initCampusPaths().catch(err => {
    console.error('Init error:', err);
    process.exit(1);
  });
}

