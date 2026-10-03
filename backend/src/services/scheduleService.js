/**
 * Schedule processing service
 * Đảm nhiệm toàn bộ logic bóc tách thời khóa biểu, định vị phòng học,
 * chỉ đường tòa nhà, gom nhóm theo ngày trong tuần và tìm ca học tiếp theo.
 */

// Hàm phân tích phòng học và sinh hướng dẫn chỉ đường chi tiết
function parseRoomDirections(roomRaw) {
  const room = (roomRaw || '').trim();
  const upper = room.toUpperCase();

  let building = 'Tòa A - Giảng đường chính';
  let buildingCode = 'Tòa A';
  let floor = 'Tầng 1';
  let mapQuery = 'Tòa A';

  if (
    upper.includes('LAB') ||
    upper.includes('NET') ||
    upper.includes('MÁY TÍNH') ||
    upper.includes('C')
  ) {
    building = 'Tòa C - Trung tâm Thực hành CNTT & Labs';
    buildingCode = 'Tòa C';
    mapQuery = 'Tòa C';
  } else if (upper.includes('B') || upper.includes('ENG-B')) {
    building = 'Tòa B - Khối Giảng đường Kỹ thuật';
    buildingCode = 'Tòa B';
    mapQuery = 'Tòa B';
  } else if (upper.includes('A') || upper.includes('ENG-A')) {
    building = 'Tòa A - Giảng đường Lý thuyết';
    buildingCode = 'Tòa A';
    mapQuery = 'Tòa A';
  } else if (upper.includes('D')) {
    building = 'Tòa D - Khu Đào tạo Quốc tế';
    buildingCode = 'Tòa D';
    mapQuery = 'Tòa D';
  }

  // Tách tầng dựa trên mã phòng (ví dụ B204 -> tầng 2, A102 -> tầng 1, 301 -> tầng 3)
  const matchThreeOrFour = upper.match(/(\d{3,4})/);
  if (matchThreeOrFour) {
    const num = matchThreeOrFour[1];
    const floorDigit = num.length === 3 ? num[0] : num.slice(0, 2);
    floor = `Tầng ${floorDigit}`;
  } else {
    const matchLabOrSingle =
      upper.match(/LAB[-_\s]*0?(\d)/i) ||
      upper.match(/TẦNG\s*(\d+)/i) ||
      upper.match(/T(\d+)/i);
    if (matchLabOrSingle) {
      floor = `Tầng ${matchLabOrSingle[1]}`;
    }
  }

  const steps = [
    {
      step: 1,
      title: 'Cổng chính khuôn viên trường',
      desc: `Từ cổng chính đi thẳng qua trục đường trung tâm hướng về phía ${buildingCode}.`,
      icon: 'compass',
    },
    {
      step: 2,
      title: `Vào sảnh chính ${buildingCode}`,
      desc: `Bước vào sảnh chính ${buildingCode}, có thể tra cứu sơ đồ phân phòng tại bảng thông báo sảnh.`,
      icon: 'home',
    },
    {
      step: 3,
      title: `Lên ${floor}`,
      desc: `Sử dụng thang bộ hoặc thang máy khu vực hành lang chính để di chuyển lên ${floor}.`,
      icon: 'arrow-up-circle',
    },
    {
      step: 4,
      title: `Đến phòng ${room || 'học'}`,
      desc: `Rẽ theo biển báo số phòng dọc hành lang ${floor}, phòng ${room || 'học'} nằm ở vị trí tương ứng.`,
      icon: 'map-pin',
    },
  ];

  const tips = [
    `Cây nước nóng lạnh và nhà vệ sinh nằm ở hai đầu hành lang ${floor}.`,
    `Thang máy thường đông vào đầu ca học, bạn có thể đi thang bộ để nhanh hơn.`,
    `Nên đến trước giờ vào lớp 5 - 10 phút để ổn định vị trí và điểm danh.`,
  ];

  return {
    room: room || 'Phòng học',
    building,
    buildingCode,
    floor,
    mapQuery,
    steps,
    tips,
  };
}

// Chuyển chuỗi tên ngày sang mã số ngày (2: Thứ 2, ..., 7: Thứ 7, 1: CN)
function getDayNumber(dayStr) {
  if (!dayStr) return 2;
  const l = dayStr.toLowerCase();
  if (l.startsWith('thứ 3') || l.includes('thứ ba')) return 3;
  if (l.startsWith('thứ 4') || l.includes('thứ tư')) return 4;
  if (l.startsWith('thứ 5') || l.includes('thứ năm')) return 5;
  if (l.startsWith('thứ 6') || l.includes('thứ sáu')) return 6;
  if (l.startsWith('thứ 7') || l.includes('thứ bảy')) return 7;
  if (l.includes('cn') || l.includes('chủ nhật')) return 1;
  return 2;
}

const DAYS_OF_WEEK = [
  { label: 'Thứ 2', num: 2 },
  { label: 'Thứ 3', num: 3 },
  { label: 'Thứ 4', num: 4 },
  { label: 'Thứ 5', num: 5 },
  { label: 'Thứ 6', num: 6 },
  { label: 'Thứ 7', num: 7 },
  { label: 'CN', num: 1 },
];

/**
 * Xử lý dữ liệu bảng thời khóa biểu thô:
 * - Chuyển sang mảng danh sách lịch học chuẩn ScheduleItem
 * - Gom nhóm theo từng ngày trong tuần
 * - Trích xuất tiết học tiếp theo (nextClass)
 * - Tự động gắn hướng dẫn chỉ đường cho từng phòng học
 */
function processSchedulePayload(rawTables, weekRangeText) {
  const parsed = [];
  const groupedByDay = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  };

  if (Array.isArray(rawTables) && rawTables.length > 0) {
    const rows = rawTables[0]?.rows || [];
    if (rows.length > 1) {
      rows.slice(1).forEach((r, idx) => {
        if (Array.isArray(r) && r.length >= 5) {
          const dayStr = r[0] || 'Thứ 2';
          const dayNum = getDayNumber(dayStr);
          const course = r[1] || 'Môn học';
          const time = r[2] ? `Tiết ${r[2]}` : 'Ca học tiêu chuẩn';
          const room = r[3] || 'Khu giảng đường';
          const lecturer = r[4] || 'Giảng viên bộ môn';

          const direction = parseRoomDirections(room);

          const item = {
            id: `sc-${idx + 1}`,
            course,
            code: dayStr,
            time,
            room,
            day: dayStr,
            dayNum,
            lecturer,
            direction,
          };

          parsed.push(item);
          if (groupedByDay[dayNum]) {
            groupedByDay[dayNum].push(item);
          }
        }
      });
    }
  }

  // Xác định tiết học hôm nay và tiết học kế tiếp
  const todayJsDay = new Date().getDay(); // 0 là CN, 1 là T2, ...
  const currentDayNum = todayJsDay === 0 ? 1 : todayJsDay + 1; // quy đổi về 1: CN, 2: T2, ...

  const todaySchedule = groupedByDay[currentDayNum] || [];

  let nextClass = null;
  if (todaySchedule.length > 0) {
    nextClass = {
      subject: todaySchedule[0].course,
      room: todaySchedule[0].room,
      time: todaySchedule[0].time,
      lecturer: todaySchedule[0].lecturer,
      day: todaySchedule[0].day,
      direction: todaySchedule[0].direction,
    };
  } else if (parsed.length > 0) {
    nextClass = {
      subject: parsed[0].course,
      room: parsed[0].room,
      time: parsed[0].time,
      lecturer: parsed[0].lecturer,
      day: parsed[0].day,
      direction: parsed[0].direction,
    };
  }

  return {
    weekRange: weekRangeText || 'Từ ngày 28/09/2026 đến ngày 04/10/2026',
    days: DAYS_OF_WEEK,
    currentDayNum,
    schedules: parsed,
    groupedByDay,
    todaySchedule,
    nextClass,
    tables: rawTables, // Giữ tương thích ngược
  };
}

module.exports = {
  parseRoomDirections,
  getDayNumber,
  DAYS_OF_WEEK,
  processSchedulePayload,
};
