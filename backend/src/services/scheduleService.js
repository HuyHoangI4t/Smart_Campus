/**
 * Schedule processing service
 * Đảm nhiệm toàn bộ logic bóc tách thời khóa biểu, định vị phòng học,
 * chỉ đường tòa nhà, gom nhóm theo ngày trong tuần và tìm ca học tiếp theo.
 */

// Hàm phân tích phòng học và sinh hướng dẫn chỉ đường chi tiết
function parseRoomDirections(roomRaw) {
  const room = (roomRaw || '').trim();
  const upper = room.toUpperCase();

  let building = 'Nhà học số 2';
  let buildingCode = 'Nhà 2';
  let floor = '';
  let mapQuery = 'Nhà 2';
  let roomDisplay = room || 'Khu giảng đường';

  // 1. Dạng 3 phần: X.Y.Z (vd: 7.3.18 -> Nhà 7, Tầng 3, Phòng 18)
  const match3 = upper.match(/^(\d+)\s*\.\s*(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
  if (match3) {
    const bNum = match3[1];
    const fNum = match3[2];
    const rNum = match3[3];
    const extra = match3[4] ? match3[4].trim() : '';
    buildingCode = `Nhà ${bNum}`;
    building = `Nhà học số ${bNum}`;
    floor = `Tầng ${fNum}`;
    roomDisplay = `Phòng ${rNum}${extra ? ` ${extra}` : ''}`;
    mapQuery = buildingCode;
  } else {
    // 2. Dạng 2 phần: X.Z (vd: 2.20 -> Nhà 2, Phòng 20; 2.21 (CLC) -> Nhà 2, Phòng 21 (CLC))
    const match2 = upper.match(/^(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
    if (match2) {
      const bNum = match2[1];
      const rNum = match2[2];
      const extra = match2[3] ? match2[3].trim() : '';
      buildingCode = `Nhà ${bNum}`;
      building = `Nhà học số ${bNum}`;
      floor = '';
      roomDisplay = `Phòng ${rNum}${extra ? ` ${extra}` : ''}`;
      mapQuery = buildingCode;
    } else if (upper.includes('400')) {
      building = 'Giảng đường 400 chỗ';
      buildingCode = 'GĐ 400';
      mapQuery = 'Giảng đường 400 chỗ';
      roomDisplay = 'Hội trường lớn 400 chỗ';
    } else if (upper.includes('200')) {
      building = 'Giảng đường 200 chỗ';
      buildingCode = 'GĐ 200';
      mapQuery = 'Giảng đường 200 chỗ';
      roomDisplay = 'Hội trường vừa 200 chỗ';
    } else if (upper.includes('THƯ VIỆN') || upper.includes('THU VIEN')) {
      building = 'Thư viện Trung tâm';
      buildingCode = 'Thư viện';
      mapQuery = 'Thư viện Trung tâm';
    } else if (upper.includes('QUỐC PHÒNG') || upper.includes('GDQP') || upper.includes('QP-AN')) {
      building = 'Trung tâm Giáo dục Quốc phòng và An ninh';
      buildingCode = 'TT GDQP';
      mapQuery = 'Trung tâm Giáo dục Quốc phòng và An ninh';
    } else if (upper.includes('Y DƯỢC') || upper.includes('Y DUOC')) {
      building = 'Nhà học số 5 - Khoa Y Dược';
      buildingCode = 'Nhà 5';
      mapQuery = 'Nhà học số 5';
    } else if (upper.includes('KINH TẾ') || upper.includes('KINH TE')) {
      building = 'Nhà học số 7 - Khoa Kinh tế';
      buildingCode = 'Nhà 7';
      mapQuery = 'Nhà học số 7';
    } else if (upper.includes('SƯ PHẠM') || upper.includes('SU PHAM')) {
      building = 'Nhà học số 8 - Khoa Sư phạm';
      buildingCode = 'Nhà 8';
      mapQuery = 'Nhà học số 8';
    } else if (upper.includes('CÔNG NGHỆ') || upper.includes('CNTT') || upper.includes('TỰ NHIÊN')) {
      building = 'Nhà học số 9 - Khoa KHTN & Công nghệ';
      buildingCode = 'Nhà 9';
      mapQuery = 'Nhà học số 9';
    } else {
      const bMatch = upper.match(/NHÀ\s*(\d+)/i);
      if (bMatch) {
        buildingCode = `Nhà ${bMatch[1]}`;
        building = `Nhà học số ${bMatch[1]}`;
        mapQuery = buildingCode;
      }
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
  ];

  if (floor) {
    steps.push({
      step: 3,
      title: `Lên ${floor}`,
      desc: `Sử dụng thang bộ hoặc thang máy khu vực hành lang chính để di chuyển lên ${floor}.`,
      icon: 'arrow-up-circle',
    });
    steps.push({
      step: 4,
      title: `Đến ${roomDisplay}`,
      desc: `Rẽ theo biển báo số phòng dọc hành lang ${floor}, ${roomDisplay} nằm ở vị trí tương ứng.`,
      icon: 'map-pin',
    });
  } else {
    steps.push({
      step: 3,
      title: `Đến ${roomDisplay}`,
      desc: `Đi theo biển chỉ dẫn số phòng tại khu vực ${buildingCode}, ${roomDisplay} nằm ở vị trí tương ứng.`,
      icon: 'map-pin',
    });
  }

  const tips = [
    `Cây nước nóng lạnh và nhà vệ sinh nằm ở hai đầu hành lang.`,
    `Thang máy thường đông vào đầu ca học, bạn có thể đi thang bộ để nhanh hơn.`,
    `Nên đến trước giờ vào lớp 5 - 10 phút để ổn định vị trí và điểm danh.`,
  ];

  return {
    room: roomDisplay,
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

  // Xác định tiết học hôm nay và tiết học kế tiếp (bao gồm logic ngày mai)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayJsDay = now.getDay(); // 0 là CN, 1 là T2, ...
  const currentDayNum = todayJsDay === 0 ? 1 : todayJsDay + 1; // 1: CN, 2: T2, 3: T3, ...
  const tomorrowDayNum = (currentDayNum % 7) + 1;

  const parseTimeRange = (timeStr) => {
    const range = (timeStr || '').match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (range) {
      const s = parseInt(range[1], 10);
      const e = parseInt(range[2], 10);
      return {
        startMin: s >= 6 ? 13 * 60 + 30 : 7 * 60,
        endMin: e >= 6 ? 17 * 60 : 10 * 60 + 40,
      };
    }
    return { startMin: 6 * 60 + 45 , endMin: 11 * 60 + 30 };
  };

  const todaySchedule = groupedByDay[currentDayNum] || [];
  const inProgress = todaySchedule.find((c) => {
    const t = parseTimeRange(c.time);
    return currentMinutes >= t.startMin && currentMinutes <= t.endMin;
  });
  const upcomingToday = todaySchedule.find((c) => {
    const t = parseTimeRange(c.time);
    return currentMinutes < t.startMin;
  });

  let nextClass = null;
  if (inProgress) {
    nextClass = {
      subject: inProgress.course,
      room: inProgress.room,
      time: inProgress.time,
      lecturer: inProgress.lecturer,
      day: inProgress.day,
      direction: inProgress.direction,
      status: 'IN_PROGRESS',
      statusLabel: 'ĐANG TRONG GIỜ HỌC',
      dayText: 'Hôm nay',
    };
  } else if (upcomingToday) {
    nextClass = {
      subject: upcomingToday.course,
      room: upcomingToday.room,
      time: upcomingToday.time,
      lecturer: upcomingToday.lecturer,
      day: upcomingToday.day,
      direction: upcomingToday.direction,
      status: 'UPCOMING_TODAY',
      statusLabel: 'LỚP HỌC KẾ TIẾP',
      dayText: 'Hôm nay',
    };
  } else {
    // 2. Hôm nay đã hết tiết hoặc không có lịch: Ưu tiên tìm NGÀY MAI
    const tomorrowSchedule = groupedByDay[tomorrowDayNum] || [];
    if (tomorrowSchedule.length > 0) {
      nextClass = {
        subject: tomorrowSchedule[0].course,
        room: tomorrowSchedule[0].room,
        time: tomorrowSchedule[0].time,
        lecturer: tomorrowSchedule[0].lecturer,
        day: tomorrowSchedule[0].day,
        direction: tomorrowSchedule[0].direction,
        status: 'NEXT_DAY',
        statusLabel: 'NGÀY MAI',
        dayText: 'Ngày mai',
      };
    } else {
      // 3. Nếu ngày mai không có tiết, tìm ngày tiếp theo gần nhất
      for (let offset = 2; offset <= 7; offset++) {
        const nextDayNum = ((currentDayNum - 1 + offset) % 7) + 1;
        const upcomingClasses = groupedByDay[nextDayNum] || [];
        if (upcomingClasses.length > 0) {
          nextClass = {
            subject: upcomingClasses[0].course,
            room: upcomingClasses[0].room,
            time: upcomingClasses[0].time,
            lecturer: upcomingClasses[0].lecturer,
            day: upcomingClasses[0].day,
            direction: upcomingClasses[0].direction,
            status: 'NEXT_DAY',
            statusLabel: `LỊCH HỌC ${upcomingClasses[0].day?.toUpperCase() || ''}`,
            dayText: upcomingClasses[0].day,
          };
          break;
        }
      }
    }
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
