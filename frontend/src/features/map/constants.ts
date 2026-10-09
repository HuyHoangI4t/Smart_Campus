import { LocationItem, CampusGate } from './types';

export const TAY_NGUYEN_CAMPUS_LOCATIONS: LocationItem[] = [
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
  },
  {
    "id": 38,
    "name": "Nhà vệ sinh (WC) - Giảng đường 400 chỗ",
    "category": "WC",
    "building": "Khu WC GĐ 400",
    "floor": "Tầng trệt",
    "description": "Khu vệ sinh nam nữ công cộng phía sau Giảng đường 400 chỗ, gần Thư viện và Hồ nước.",
    "lat": 12.65142,
    "lng": 108.02535,
    "icon": "droplet",
    "x": 68,
    "y": 59,
    "color": "#0284C7"
  },
  {
    "id": 39,
    "name": "Nhà vệ sinh (WC) - Nhà học số 2",
    "category": "WC",
    "building": "Khu WC Nhà học số 2",
    "floor": "Tầng 1 - 3",
    "description": "Khu vệ sinh nam nữ phục vụ giảng đường Nhà học số 2 và khu Hiệu bộ.",
    "lat": 12.65065,
    "lng": 108.02425,
    "icon": "droplet",
    "x": 72,
    "y": 32,
    "color": "#0284C7"
  },
  {
    "id": 40,
    "name": "Nhà vệ sinh (WC) - Dãy Nhà học 7, 8, 9",
    "category": "WC",
    "building": "Khu WC Dãy Nhà 7-8-9",
    "floor": "Tầng 1 - 4",
    "description": "Khu vệ sinh công cộng phục vụ sinh viên khối Khoa Kinh tế, Sư phạm, CNTT & KHTN.",
    "lat": 12.65185,
    "lng": 108.02465,
    "icon": "droplet",
    "x": 81,
    "y": 58,
    "color": "#0284C7"
  },
  {
    "id": 41,
    "name": "Nhà vệ sinh (WC) - Khu Thể thao & Nhà thi đấu",
    "category": "WC",
    "building": "Khu WC Thể thao",
    "floor": "Tầng trệt",
    "description": "Khu vệ sinh và phòng thay đồ phục vụ sinh viên học Giáo dục thể chất, sân bóng, nhà thi đấu.",
    "lat": 12.64955,
    "lng": 108.02525,
    "icon": "droplet",
    "x": 42,
    "y": 25,
    "color": "#0284C7"
  },
  {
    "id": 42,
    "name": "Nhà vệ sinh (WC) - Căn tin & Đảo sinh viên",
    "category": "WC",
    "building": "Khu WC Căn tin",
    "floor": "Tầng trệt",
    "description": "Khu vệ sinh công cộng khu vực ăn uống, giải khát và sinh hoạt Đảo sinh viên.",
    "lat": 12.65198,
    "lng": 108.02582,
    "icon": "droplet",
    "x": 69,
    "y": 76,
    "color": "#0284C7"
  }
];

/**
 * Tọa độ tâm khuôn viên Trường Đại học Tây Nguyên theo OpenStreetMap (way 241971731)
 * Latitude: 12.65067° N, Longitude: 108.02621° E
 */
export const TNU_CAMPUS_CENTER: { lat: number; lng: number } = {
  lat: 12.65067,
  lng: 108.02621,
};

/**
 * Tọa độ 17 đỉnh ranh giới khuôn viên trường trích xuất trực tiếp từ
 * OpenStreetMap (way id: 241971731) khép kín.
 */
export const TNU_OSM_WAY_241971731_BOUNDARY: [number, number][] = [
  [12.6504501, 108.0227974],
  [12.6526686, 108.0249367],
  [12.6538608, 108.0257948],
  [12.6536940, 108.0259715],
  [12.6537760, 108.0260676],
  [12.6529190, 108.0269044],
  [12.6512084, 108.0285744],
  [12.6501324, 108.0296250],
  [12.6497469, 108.0295173],
  [12.6497434, 108.0295163],
  [12.6494911, 108.0292461],
  [12.6475414, 108.0271490],
  [12.6474833, 108.0270469],
  [12.6483353, 108.0261226],
  [12.6484902, 108.0261226],
  [12.6486369, 108.0259951],
  [12.6491210, 108.0241239],
  [12.6504501, 108.0227974]
];

export const TNU_CAMPUS_BOUNDARY: [number, number][] = [
  [
    12.64936184489708,
    108.023709984411
  ],
  [
    12.64939692098337,
    108.0238593195032
  ],
  [
    12.64922366673725,
    108.0240207114143
  ],
  [
    12.64914996044008,
    108.0240744632604
  ],
  [
    12.64910731131839,
    108.024143411979
  ],
  [
    12.64905641908621,
    108.0243138201567
  ],
  [
    12.64897030232368,
    108.024311073955
  ],
  [
    12.64846679989001,
    108.0241911062746
  ],
  [
    12.64835017475937,
    108.0247583489782
  ],
  [
    12.64825912642829,
    108.0252039642648
  ],
  [
    12.64879024169141,
    108.0253483229021
  ],
  [
    12.6487228183857,
    108.0255963896767
  ],
  [
    12.64881339164961,
    108.025958958011
  ],
  [
    12.6480975797379,
    108.026419767791
  ],
  [
    12.64746230619225,
    108.0270818650112
  ],
  [
    12.64783491871413,
    108.0274820029304
  ],
  [
    12.64817683713212,
    108.0278523418964
  ],
  [
    12.64834014924507,
    108.0280072175512
  ],
  [
    12.64837815224221,
    108.0280034990301
  ],
  [
    12.64843362651117,
    108.0280736004634
  ],
  [
    12.648424127415,
    108.0281079564623
  ],
  [
    12.64851185632938,
    108.0282133043701
  ],
  [
    12.64887356697684,
    108.0285996439882
  ],
  [
    12.64924557138193,
    108.0290044662777
  ],
  [
    12.64940948705378,
    108.0291786420854
  ],
  [
    12.64957989265152,
    108.0293607651568
  ],
  [
    12.6497233278739,
    108.0295277768443
  ],
  [
    12.64979058097085,
    108.0295986717908
  ],
  [
    12.6498738024417,
    108.0296363735788
  ],
  [
    12.65004690533162,
    108.029681693164
  ],
  [
    12.65012590824586,
    108.0296826255635
  ],
  [
    12.6502227605403,
    108.029608578842
  ],
  [
    12.65037273737863,
    108.0294754334155
  ],
  [
    12.65068472907029,
    108.0291690340094
  ],
  [
    12.65130925932491,
    108.0285346899524
  ],
  [
    12.65253281247356,
    108.0273262157134
  ],
  [
    12.65326595038413,
    108.0266371644356
  ],
  [
    12.65351972219521,
    108.0263648962711
  ],
  [
    12.6536705590384,
    108.026217818969
  ],
  [
    12.65381199629214,
    108.0260589411716
  ],
  [
    12.65367438187265,
    108.025658267053
  ],
  [
    12.65316607382772,
    108.0252839823841
  ],
  [
    12.65288132324158,
    108.0250658838366
  ],
  [
    12.65241666236353,
    108.024653847315
  ],
  [
    12.65209761057217,
    108.024331765829
  ],
  [
    12.65178083015148,
    108.0239849309481
  ],
  [
    12.65163902006585,
    108.023884193641
  ],
  [
    12.65155443502066,
    108.0238907083279
  ],
  [
    12.65150095363651,
    108.0238432594696
  ],
  [
    12.65152219056682,
    108.0237942110838
  ],
  [
    12.65095951369571,
    108.023257667042
  ],
  [
    12.65066664206127,
    108.0229636143608
  ],
  [
    12.6504510945065,
    108.0227472291479
  ],
  [
    12.65042001012422,
    108.0227337420068
  ],
  [
    12.65038955548521,
    108.0227619676594
  ],
  [
    12.65010276714285,
    108.0230426974618
  ],
  [
    12.64980850157077,
    108.0233338952721
  ],
  [
    12.64951862228554,
    108.0236355295628
  ],
  [
    12.64936184489708,
    108.023709984411
  ]
];

export const TNU_CAMPUS_GATES: CampusGate[] = [
  {
    id: 'front_gate',
    name: 'Cổng trước (Lê Duẩn)',
    gatePoint: [12.651536, 108.023856],
    insidePoint: [12.65144, 108.02395],
    outsidePoint: [12.65154752, 108.02385583]
  },
  {
    id: 'back_gate',
    name: 'Cổng sau (Y Wang)',
    gatePoint: [12.64837195, 108.02804429],
    insidePoint: [12.64850, 108.02798],
    outsidePoint: [12.64837195, 108.02804429]
  },
  {
    id: 'hospital_gate',
    name: 'Cổng bệnh viện',
    gatePoint: [12.650645, 108.022990],
    insidePoint: [12.65050, 108.02308],
    outsidePoint: [12.650645, 108.022990]
  }
];

export const TNU_SAMPLE_TEST_LOCATIONS = [
  {
    id: 'hospital_gate',
    name: 'Cổng bệnh viện (Lê Duẩn)',
    desc: 'Điểm đón/cổng mới trên đường Lê Duẩn',
    latitude: 12.650645,
    longitude: 108.022990,
    icon: 'local-hospital',
    badge: 'Mới'
  },
  {
    id: 'front_gate',
    name: 'Cổng trước (Lê Duẩn)',
    desc: 'Cổng chính Trường ĐH Tây Nguyên',
    latitude: 12.651536,
    longitude: 108.023856,
    icon: 'door-front',
    badge: 'Cổng chính'
  },
  {
    id: 'back_gate',
    name: 'Cổng sau (Y Wang)',
    desc: 'Cổng phụ kết nối đường Y Wang',
    latitude: 12.648372,
    longitude: 108.028044,
    icon: 'door-sliding',
    badge: 'Cổng sau'
  },
  {
    id: 'admin_building',
    name: 'Tòa nhà Điều hành (Khu Hiệu bộ)',
    desc: 'Trung tâm hành chính trường',
    latitude: 12.650900,
    longitude: 108.024100,
    icon: 'business',
    badge: 'Nội bộ'
  },
  {
    id: 'central_library',
    name: 'Thư viện trung tâm',
    desc: 'Khu vực tự học & thư viện trường',
    latitude: 12.651030,
    longitude: 108.025340,
    icon: 'local-library',
    badge: 'Học tập'
  }
];
