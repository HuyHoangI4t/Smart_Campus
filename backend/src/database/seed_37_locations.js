const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const TAY_NGUYEN_CAMPUS_LOCATIONS = [
  {
    "id": 1,
    "name": "Tòa nhà Điều hành (Khu Hiệu bộ)",
    "category": "Hành chính",
    "building": "Tòa Hiệu Bộ",
    "floor": "Tầng 1 - 7",
    "description": "Ban Giám hiệu, Phòng Đào tạo, Phòng CTSV, Phòng Tài chính...",
    "lat": 12.6509,
    "lng": 108.0241,
    "icon": "briefcase",
    "x": 76,
    "y": 33,
    "color": "#10B981"
  },
  {
    "id": 2,
    "name": "Nhà học số 2 - Khoa Ngoại ngữ - Khoa Lý luận chính trị",
    "category": "Giảng đường",
    "building": "Nhà học số 2",
    "floor": "Tầng 1 - 3",
    "description": "Khu vực giảng đường ngoại ngữ và lý luận chính trị.",
    "lat": 12.650725,
    "lng": 108.02431,
    "icon": "book-open",
    "x": 71,
    "y": 33,
    "color": "#8B5CF6"
  },
  {
    "id": 3,
    "name": "Phòng thí nghiệm Khoa Y Dược",
    "category": "Phòng thí nghiệm",
    "building": "Phòng TN Y Dược",
    "floor": "Tầng 1 - 3",
    "description": "Phòng thí nghiệm thực hành chuyên ngành Y - Dược.",
    "lat": 12.650585,
    "lng": 108.024478,
    "icon": "cpu",
    "x": 67,
    "y": 33,
    "color": "#06B6D4"
  },
  {
    "id": 4,
    "name": "Bệnh viện Trường Đại học Tây Nguyên",
    "category": "Y tế",
    "building": "Bệnh viện ĐH Tây Nguyên",
    "floor": "Nhiều tầng",
    "description": "Bệnh viện thực hành đa khoa và Trung tâm xét nghiệm y khoa chuyên sâu.",
    "lat": 12.650355,
    "lng": 108.023122,
    "icon": "activity",
    "x": 81,
    "y": 9,
    "color": "#EF4444"
  },
  {
    "id": 5,
    "name": "Nhà học số 5 - Khoa Y Dược",
    "category": "Giảng đường",
    "building": "Nhà học số 5",
    "floor": "Tầng 1 - 4",
    "description": "Giảng đường chính đào tạo khối ngành Y Đa khoa, Điều dưỡng, Dược học.",
    "lat": 12.65005,
    "lng": 108.023828,
    "icon": "book-open",
    "x": 68,
    "y": 14,
    "color": "#6366F1"
  },
  {
    "id": 6,
    "name": "Nhà học số 6",
    "category": "Giảng đường",
    "building": "Nhà học số 6",
    "floor": "Tầng 1",
    "description": "Khu giảng đường học tập chung của các khoa.",
    "lat": 12.65035,
    "lng": 108.0251,
    "icon": "layers",
    "x": 56,
    "y": 38,
    "color": "#06B6D4"
  },
  {
    "id": 7,
    "name": "Nhà học số 7 - Khoa Kinh tế - Trung tâm Ngoại ngữ Tin học",
    "category": "Giảng đường",
    "building": "Nhà học số 7",
    "floor": "Tầng 1 - 4",
    "description": "Khu giảng đường Khoa Kinh tế, Trung tâm NN-TH.",
    "lat": 12.65168,
    "lng": 108.024456,
    "icon": "book-open",
    "x": 82,
    "y": 52,
    "color": "#F97316"
  },
  {
    "id": 8,
    "name": "Nhà học số 8 - Khoa Sư phạm",
    "category": "Giảng đường",
    "building": "Nhà học số 8",
    "floor": "Tầng 1 - 4",
    "description": "Giảng đường chính của Khoa Sư phạm.",
    "lat": 12.651975,
    "lng": 108.02485,
    "icon": "book-open",
    "x": 81,
    "y": 63,
    "color": "#3B82F6"
  },
  {
    "id": 9,
    "name": "Nhà học số 9 - Khoa Khoa học Tự nhiên và Công nghệ",
    "category": "Giảng đường",
    "building": "Nhà học số 9",
    "floor": "Tầng 1 - 4",
    "description": "Khoa CNTT, Toán, Vật lý, Hóa học...",
    "lat": 12.65227,
    "lng": 108.025244,
    "icon": "cpu",
    "x": 80,
    "y": 74,
    "color": "#1E3A8A"
  },
  {
    "id": 10,
    "name": "Giảng đường 400 chỗ",
    "category": "Hội trường",
    "building": "Hội trường lớn",
    "floor": "Tầng 1",
    "description": "Hội trường lớn tổ chức sự kiện, hội thảo và các lớp đại cương đông sinh viên.",
    "lat": 12.65134,
    "lng": 108.025204,
    "icon": "award",
    "x": 68,
    "y": 57,
    "color": "#F59E0B"
  },
  {
    "id": 11,
    "name": "Giảng đường 200 chỗ",
    "category": "Hội trường",
    "building": "Hội trường vừa",
    "floor": "Tầng 1",
    "description": "Hội trường tổ chức chuyên đề, bảo vệ khóa luận và sinh hoạt lớp.",
    "lat": 12.651785,
    "lng": 108.025282,
    "icon": "award",
    "x": 73,
    "y": 66,
    "color": "#F59E0B"
  },
  {
    "id": 12,
    "name": "Viện Công nghệ Sinh học & Môi trường",
    "category": "Nghiên cứu",
    "building": "Viện CNSH & MT",
    "floor": "Tầng 1 - 3",
    "description": "Nghiên cứu công nghệ sinh học và tài nguyên môi trường Tây Nguyên.",
    "lat": 12.65261,
    "lng": 108.025924,
    "icon": "cpu",
    "x": 76,
    "y": 90,
    "color": "#10B981"
  },
  {
    "id": 13,
    "name": "Thư viện Trung tâm",
    "category": "Học tập",
    "building": "Tòa Thư viện",
    "floor": "Tầng 1 - 2",
    "description": "Thư viện tài liệu học tập, phòng tự học và tra cứu thông tin.",
    "lat": 12.65114,
    "lng": 108.025308,
    "icon": "book",
    "x": 64,
    "y": 55,
    "color": "#F59E0B"
  },
  {
    "id": 14,
    "name": "Ký túc xá số 2",
    "category": "Ký túc xá",
    "building": "KTX 2",
    "floor": "Tầng 1 - 4",
    "description": "Khu nội trú ký túc xá sinh viên số 2.",
    "lat": 12.650675,
    "lng": 108.026478,
    "icon": "home",
    "x": 43,
    "y": 64,
    "color": "#8B5CF6"
  },
  {
    "id": 15,
    "name": "Trung tâm Ứng dụng và Tư vấn Kỹ thuật Nông Lâm nghiệp",
    "category": "Nghiên cứu",
    "building": "TT Ứng dụng Nông Lâm",
    "floor": "Tầng 1 - 2",
    "description": "Nghiên cứu nông lâm nghiệp, chuyển giao kỹ thuật công nghệ.",
    "lat": 12.65232,
    "lng": 108.026408,
    "icon": "layers",
    "x": 66,
    "y": 92,
    "color": "#10B981"
  },
  {
    "id": 16,
    "name": "Khu đất ứng dụng và tư vấn kỹ thuật nông lâm nghiệp",
    "category": "Thực nghiệm",
    "building": "Khu thực nghiệm",
    "floor": "Mặt đất",
    "description": "Khu vườn thực vật và đất thí nghiệm thực hành nông nghiệp.",
    "lat": 12.651245,
    "lng": 108.027086,
    "icon": "award",
    "x": 43,
    "y": 83,
    "color": "#10B981"
  },
  {
    "id": 17,
    "name": "Trường Mầm non Thực hành 11-11",
    "category": "Tiện ích",
    "building": "Mầm non 11-11",
    "floor": "Tầng 1 - 2",
    "description": "Trường mầm non trực thuộc phục vụ thực hành sư phạm và con em cán bộ.",
    "lat": 12.65207,
    "lng": 108.026776,
    "icon": "award",
    "x": 58,
    "y": 93,
    "color": "#EC4899"
  },
  {
    "id": 18,
    "name": "Trường THPT Thực hành Cao Nguyên",
    "category": "Giảng đường",
    "building": "THPT Thực hành",
    "floor": "Tầng 1 - 4",
    "description": "Trường THPT Thực hành Cao Nguyên trực thuộc Đại học Tây Nguyên.",
    "lat": 12.651615,
    "lng": 108.027798,
    "icon": "book-open",
    "x": 39,
    "y": 100,
    "color": "#3B82F6"
  },
  {
    "id": 19,
    "name": "Trung tâm Giáo dục Quốc phòng và An ninh Trường ĐH Tây Nguyên",
    "category": "Giảng đường",
    "building": "TT GDQP-AN",
    "floor": "Tầng 1 - 4",
    "description": "Trung tâm GDQP-AN đào tạo kiến thức QP-AN cho sinh viên toàn vùng Tây Nguyên.",
    "lat": 12.649645,
    "lng": 108.026966,
    "icon": "award",
    "x": 23,
    "y": 53,
    "color": "#EF4444"
  },
  {
    "id": 20,
    "name": "Thao trường quân sự",
    "category": "Tiện ích",
    "building": "Thao trường",
    "floor": "Bãi tập",
    "description": "Bãi tập bắn súng, chiến thuật và thao trường huấn luyện quân sự ngoài trời.",
    "lat": 12.650615,
    "lng": 108.02689,
    "icon": "award",
    "x": 37,
    "y": 69,
    "color": "#F59E0B"
  },
  {
    "id": 21,
    "name": "Khu thể thao",
    "category": "Thể thao",
    "building": "Sân vận động",
    "floor": "Mặt sân",
    "description": "Sân vận động, sân bóng đá, đường chạy điền kinh phục vụ rèn luyện thể chất.",
    "lat": 12.649835,
    "lng": 108.026058,
    "icon": "award",
    "x": 37,
    "y": 43,
    "color": "#06B6D4"
  },
  {
    "id": 22,
    "name": "Nhà thi đấu thể thao",
    "category": "Thể thao",
    "building": "Nhà thi đấu",
    "floor": "Tầng 1",
    "description": "Nhà thi đấu đa năng trong nhà cho cầu lông, bóng chuyền, bóng rổ.",
    "lat": 12.64949,
    "lng": 108.025452,
    "icon": "award",
    "x": 40,
    "y": 28,
    "color": "#3B82F6"
  },
  {
    "id": 23,
    "name": "Hồ bơi",
    "category": "Thể thao",
    "building": "Khu hồ bơi",
    "floor": "Bể bơi",
    "description": "Bể bơi tiêu chuẩn phục vụ học phần bơi lội và thể thao dưới nước.",
    "lat": 12.64946,
    "lng": 108.024944,
    "icon": "award",
    "x": 46,
    "y": 20,
    "color": "#06B6D4"
  },
  {
    "id": 24,
    "name": "Toà nhà Thí nghiệm Khoa Nông nghiệp",
    "category": "Phòng thí nghiệm",
    "building": "Khu TN Nông nghiệp",
    "floor": "Tầng 1 - 3",
    "description": "Khu phòng thí nghiệm chuyên ngành Nông - Lâm - Thủy sản.",
    "lat": 12.65154,
    "lng": 108.026052,
    "icon": "cpu",
    "x": 60,
    "y": 73,
    "color": "#06B6D4"
  },
  {
    "id": 25,
    "name": "Ký túc xá Lào - Campuchia",
    "category": "Ký túc xá",
    "building": "KTX Lưu học sinh",
    "floor": "Tầng 1 - 3",
    "description": "Ký túc xá dành cho lưu học sinh quốc tế Lào và Campuchia.",
    "lat": 12.65145,
    "lng": 108.026432,
    "icon": "home",
    "x": 54,
    "y": 77,
    "color": "#8B5CF6"
  },
  {
    "id": 26,
    "name": "Ký túc xá số 1",
    "category": "Ký túc xá",
    "building": "KTX 1",
    "floor": "Tầng 1 - 4",
    "description": "Khu ký túc xá sinh viên số 1.",
    "lat": 12.650765,
    "lng": 108.026098,
    "icon": "home",
    "x": 49,
    "y": 60,
    "color": "#8B5CF6"
  },
  {
    "id": 27,
    "name": "Ký túc xá số 3",
    "category": "Ký túc xá",
    "building": "KTX 3",
    "floor": "Tầng 1 - 4",
    "description": "Khu ký túc xá sinh viên số 3.",
    "lat": 12.65059,
    "lng": 108.02726,
    "icon": "home",
    "x": 32,
    "y": 74,
    "color": "#8B5CF6"
  },
  {
    "id": 28,
    "name": "Ký túc xá số 4",
    "category": "Ký túc xá",
    "building": "KTX 4",
    "floor": "Tầng 1 - 4",
    "description": "Khu ký túc xá sinh viên số 4.",
    "lat": 12.65048,
    "lng": 108.02746,
    "icon": "home",
    "x": 28,
    "y": 75,
    "color": "#8B5CF6"
  },
  {
    "id": 29,
    "name": "Nhà khách",
    "category": "Tiện ích",
    "building": "Nhà khách TNU",
    "floor": "Tầng 1 - 3",
    "description": "Nhà khách đón tiếp chuyên gia, giảng viên thỉnh giảng và đối tác.",
    "lat": 12.65085,
    "lng": 108.025792,
    "icon": "home",
    "x": 54,
    "y": 57,
    "color": "#64748B"
  },
  {
    "id": 30,
    "name": "Sân quần vợt",
    "category": "Thể thao",
    "building": "Sân Tennis",
    "floor": "Mặt sân",
    "description": "Cụm sân quần vợt / pickleball phục vụ thể thao cán bộ và sinh viên.",
    "lat": 12.65087,
    "lng": 108.025496,
    "icon": "award",
    "x": 58,
    "y": 53,
    "color": "#06B6D4"
  },
  {
    "id": 31,
    "name": "Căn tin - Đảo sinh viên",
    "category": "Tiện ích",
    "building": "Căng tin trung tâm",
    "floor": "Tầng trệt",
    "description": "Khu ẩm thực, ăn trưa, giải khát và không gian sinh hoạt chung ngoài trời.",
    "lat": 12.65192,
    "lng": 108.025664,
    "icon": "coffee",
    "x": 70,
    "y": 74,
    "color": "#F97316"
  },
  {
    "id": 32,
    "name": "Phòng trưng bày",
    "category": "Học tập",
    "building": "Nhà Truyền thống",
    "floor": "Tầng 1",
    "description": "Nhà truyền thống và phòng trưng bày lịch sử hình thành, phát triển nhà trường.",
    "lat": 12.651075,
    "lng": 108.023414,
    "icon": "award",
    "x": 87,
    "y": 26,
    "color": "#EC4899"
  },
  {
    "id": 33,
    "name": "Nhà bảo vệ (Cổng chính Lê Duẩn)",
    "category": "Hành chính",
    "building": "Cổng chính",
    "floor": "Tầng trệt",
    "description": "Phòng kiểm soát ra vào, cổng chính số 567 Lê Duẩn.",
    "lat": 12.65138,
    "lng": 108.02366,
    "icon": "briefcase",
    "x": 88,
    "y": 35,
    "color": "#10B981"
  },
  {
    "id": 34,
    "name": "Trung tâm Kỹ năng Sư phạm",
    "category": "Học tập",
    "building": "TT Kỹ năng Sư phạm",
    "floor": "Tầng 1 - 2",
    "description": "Trung tâm rèn luyện kỹ năng nghề nghiệp và nghiệp vụ sư phạm.",
    "lat": 12.65183,
    "lng": 108.027472,
    "icon": "book-open",
    "x": 46,
    "y": 99,
    "color": "#3B82F6"
  },
  {
    "id": 35,
    "name": "Gara ô tô",
    "category": "Tiện ích",
    "building": "Gara ô tô trường",
    "floor": "Tầng trệt",
    "description": "Bãi đỗ xe ô tô và nhà để xe cán bộ, khách công tác.",
    "lat": 12.652885,
    "lng": 108.025186,
    "icon": "layers",
    "x": 89,
    "y": 84,
    "color": "#64748B"
  },
  {
    "id": 36,
    "name": "Văn phòng Công đoàn trường",
    "category": "Hành chính",
    "building": "Khu Đoàn thể",
    "floor": "Tầng 1",
    "description": "Trụ sở Ban Chấp hành Công đoàn Trường Đại học Tây Nguyên.",
    "lat": 12.650725,
    "lng": 108.023358,
    "icon": "briefcase",
    "x": 83,
    "y": 19,
    "color": "#10B981"
  },
  {
    "id": 37,
    "name": "Văn phòng Đoàn Thanh niên - Hội Sinh viên",
    "category": "Hành chính",
    "building": "Khu Đoàn thể",
    "floor": "Tầng 1",
    "description": "Trụ sở Đoàn TNCS Hồ Chí Minh & Hội Sinh viên Trường Đại học Tây Nguyên.",
    "lat": 12.65065,
    "lng": 108.023516,
    "icon": "briefcase",
    "x": 80,
    "y": 20,
    "color": "#10B981"
  }
];

async function seedLocations() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_app',
  });

  console.log('Connected to MySQL. Updating map_locations table with correctly oriented coordinates (-90 deg)...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS map_locations (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      building VARCHAR(100) NULL,
      floor VARCHAR(100) NULL,
      description TEXT NULL,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      icon VARCHAR(50) NULL,
      x INT NULL DEFAULT 50,
      y INT NULL DEFAULT 50,
      color VARCHAR(50) NULL DEFAULT '#10B981',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [cols] = await conn.query('SHOW COLUMNS FROM map_locations');
  const existingCols = cols.map(c => c.Field);

  if (!existingCols.includes('building')) {
    await conn.query('ALTER TABLE map_locations ADD COLUMN building VARCHAR(100) NULL AFTER category');
  }
  if (!existingCols.includes('floor')) {
    await conn.query('ALTER TABLE map_locations ADD COLUMN floor VARCHAR(100) NULL AFTER building');
  }
  if (!existingCols.includes('icon')) {
    await conn.query('ALTER TABLE map_locations ADD COLUMN icon VARCHAR(50) NULL AFTER description');
  }
  if (!existingCols.includes('x')) {
    await conn.query('ALTER TABLE map_locations ADD COLUMN x INT NULL DEFAULT 50');
  }
  if (!existingCols.includes('y')) {
    await conn.query('ALTER TABLE map_locations ADD COLUMN y INT NULL DEFAULT 50');
  }
  if (!existingCols.includes('color')) {
    await conn.query('ALTER TABLE map_locations ADD COLUMN color VARCHAR(50) NULL DEFAULT "#10B981"');
  }

  await conn.query('DELETE FROM map_locations');
  console.log('Cleared old map_locations');

  for (const loc of TAY_NGUYEN_CAMPUS_LOCATIONS) {
    await conn.query(
      `INSERT INTO map_locations (id, name, category, building, floor, description, lat, lng, icon, x, y, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        loc.color
      ]
    );
  }

  const [countResult] = await conn.query('SELECT count(*) as total FROM map_locations');
  console.log(`Done! Total locations in DB: ${countResult[0].total}`);

  await conn.end();
}

seedLocations().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});