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
      title: 'Cổng trường',
      desc: `Từ cổng đi thẳng qua trục đường trung tâm hướng về phía ${buildingCode}.`,
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
      desc: `Sử dụng thang bộ để di chuyển lên ${floor}.`,
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
    `Nhà xe thường đông vào đầu ca học, bạn có thể thử nhà xe khác để nhanh hơn.`,
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

// Bóc tách ngày bắt đầu và kết thúc từ chuỗi khoảng tuần
function parseWeekRangeDates(rangeText) {
  if (!rangeText) return { startDate: null, endDate: null };
  const match = rangeText.match(/Từ ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+đến ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!match) return { startDate: null, endDate: null };
  const [_, sD, sM, sY, eD, eM, eY] = match;
  const startDate = new Date(Number(sY), Number(sM) - 1, Number(sD), 0, 0, 0);
  const endDate = new Date(Number(eY), Number(eM) - 1, Number(eD), 23, 59, 59, 999);
  return { startDate, endDate };
}

// Chuẩn hóa định dạng ngày về DD/MM/YYYY
function normalizeDateVN(dateInput) {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) {
    return `${m1[1].padStart(2, '0')}/${m1[2].padStart(2, '0')}/${m1[3]}`;
  }
  const m2 = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) {
    return `${m2[3].padStart(2, '0')}/${m2[2].padStart(2, '0')}/${m2[1]}`;
  }
  return str;
}

// Chuyển chuỗi ngày DD/MM/YYYY hoặc YYYY-MM-DD sang Date object
function parseDateVN(dateInput) {
  const norm = normalizeDateVN(dateInput);
  const m = norm.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0);
}

// Xác định khoảng tuần chuẩn từ 1 ngày cụ thể
function getWeekRangeFromDate(dateInput) {
  const dObj = parseDateVN(dateInput);
  if (!dObj) return null;
  const day = dObj.getDay();
  const distToMon = (day + 6) % 7;
  const mon = new Date(dObj);
  mon.setDate(dObj.getDate() - distToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  const pad = (n) => String(n).padStart(2, '0');
  const sStr = `${pad(mon.getDate())}/${pad(mon.getMonth() + 1)}/${mon.getFullYear()}`;
  const eStr = `${pad(sun.getDate())}/${pad(sun.getMonth() + 1)}/${sun.getFullYear()}`;
  return `Từ ngày ${sStr} đến ngày ${eStr}`;
}

// Xác định tên Thứ từ ngày
function getDayNameFromDate(dateInput) {
  const dObj = parseDateVN(dateInput);
  if (!dObj) return null;
  const jsDay = dObj.getDay();
  if (jsDay === 0) return 'CN';
  return `Thứ ${jsDay + 1}`;
}

// Lọc lịch học thủ công cho một tuần cụ thể, tránh việc lịch tuần này hiện sang tuần khác
function filterCustomItemsForWeek(customItems, weekRangeText, isCurrentWeek = false) {
  if (!Array.isArray(customItems) || customItems.length === 0) return [];
  const { startDate, endDate } = parseWeekRangeDates(weekRangeText);

  return customItems.filter((c) => {
    // 1. Nếu có ngày học xác định
    if (c.ngay_hoc) {
      const cDate = parseDateVN(c.ngay_hoc);
      if (cDate && startDate && endDate) {
        return cDate >= startDate && cDate <= endDate;
      }
    }
    // 2. Nếu có week_range xác định
    if (c.week_range && weekRangeText) {
      if (c.week_range.trim().toLowerCase() === weekRangeText.trim().toLowerCase()) {
        return true;
      }
      return false;
    }
    // 3. Lịch cũ chưa có ngày và chưa có week_range: chỉ hiện ở tuần hiện tại
    return isCurrentWeek;
  });
}

/**
 * Xử lý dữ liệu bảng thời khóa biểu thô:
 * - Chuyển sang mảng danh sách lịch học chuẩn ScheduleItem
 * - Gom nhóm theo từng ngày trong tuần
 * - Trích xuất tiết học tiếp theo (nextClass)
 * - Tự động gắn hướng dẫn chỉ đường cho từng phòng học
 */
function processSchedulePayload(rawTables, weekRangeText, customItems = [], options = {}) {
  const rangeDates = parseWeekRangeDates(weekRangeText);
  const startDate = rangeDates.startDate;

  const daysWithDates = DAYS_OF_WEEK.map((d) => {
    if (!startDate) return { ...d };
    const offset = d.num === 1 ? 6 : d.num - 2;
    const dObj = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + offset);
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}/${dObj.getFullYear()}`;
    const dateShort = `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}`;
    return {
      ...d,
      date: dateFormatted,
      dateShort,
    };
  });

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
          const time = r[2] ? (String(r[2]).startsWith('Tiết') ? r[2] : `Tiết ${r[2]}`) : 'Ca học tiêu chuẩn';
          const room = r[3] || 'Khu giảng đường';
          const lecturer = r[4] || 'Giảng viên bộ môn';

          const direction = parseRoomDirections(room);

          const dayMeta = daysWithDates.find((d) => d.num === dayNum);
          const itemDate = dayMeta?.date || null;
          const itemDateShort = dayMeta?.dateShort || null;

          const item = {
            id: `sc-${idx + 1}`,
            course,
            code: dayStr,
            time,
            room,
            day: dayStr,
            dayNum,
            date: itemDate,
            dateShort: itemDateShort,
            lecturer,
            direction,
            isCustom: false,
          };

          parsed.push(item);
          if (groupedByDay[dayNum]) {
            groupedByDay[dayNum].push(item);
          }
        }
      });
    }
  }

  // Tích hợp danh sách lịch học thủ công / thực hành đột xuất (chỉ lấy lịch thuộc tuần này)
  const filteredCustom = filterCustomItemsForWeek(customItems, weekRangeText, options.isCurrentWeek ?? false);
  if (Array.isArray(filteredCustom) && filteredCustom.length > 0) {
    filteredCustom.forEach((c) => {
      const dayStr = c.thu || c.day || 'Thứ 2';
      const dayNum = c.dayNum || getDayNumber(dayStr);
      const course = c.ten_hp || c.course || 'Lịch thực hành đột xuất';
      let rawTime = String(c.tiet || c.time || 'Ca thực hành').trim();
      while (/^tiết\s+tiết/i.test(rawTime)) {
        rawTime = rawTime.replace(/^tiết\s+/i, '');
      }
      const time = rawTime.startsWith('Tiết') || rawTime.includes(':') ? rawTime : `Tiết ${rawTime}`;
      const room = c.phong || c.room || 'Phòng thực hành';
      const lecturer = c.giang_vien || c.lecturer || 'Giảng viên hướng dẫn';
      const direction = c.direction || parseRoomDirections(room);

      const dayMeta = daysWithDates.find((d) => d.num === dayNum);
      const itemDate = c.ngay_hoc ? normalizeDateVN(c.ngay_hoc) : (dayMeta?.date || null);
      const itemDateShort = itemDate ? itemDate.substring(0, 5) : (dayMeta?.dateShort || null);

      const item = {
        id: c.id,
        course,
        code: dayStr,
        time,
        room,
        day: dayStr,
        dayNum,
        date: itemDate,
        dateShort: itemDateShort,
        lecturer,
        direction,
        isCustom: true,
        note: c.ghi_chu || c.note || '',
        type: c.loai_lich || c.type || 'dot_xuat',
        ngay_hoc: itemDate,
        week_range: c.week_range || weekRangeText || null,
      };

      parsed.push(item);
      if (groupedByDay[dayNum]) {
        groupedByDay[dayNum].push(item);
      }
    });
  }

  const parseTimeRange = (timeStr) => {
    const str = timeStr || '';
    const timeMatch = str.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return {
        startMin: parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10),
        endMin: parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4], 10),
      };
    }
    const range = str.match(/(\d+)\s*[-–—]\s*(\d+)/);
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

  // Sắp xếp các tiết học trong ngày theo thứ tự thời gian
  for (let d = 1; d <= 7; d++) {
    groupedByDay[d].sort((a, b) => {
      const ta = parseTimeRange(a.time);
      const tb = parseTimeRange(b.time);
      return ta.startMin - tb.startMin;
    });
  }

  // Xác định tiết học hôm nay và tiết học kế tiếp (bao gồm logic ngày mai)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayJsDay = now.getDay(); // 0 là CN, 1 là T2, ...
  const currentDayNum = todayJsDay === 0 ? 1 : todayJsDay + 1; // 1: CN, 2: T2, 3: T3, ...
  const tomorrowDayNum = (currentDayNum % 7) + 1;

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
      isCustom: inProgress.isCustom || false,
      note: inProgress.note || '',
      type: inProgress.type || 'chinh_khoa',
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
      isCustom: upcomingToday.isCustom || false,
      note: upcomingToday.note || '',
      type: upcomingToday.type || 'chinh_khoa',
    };
  } else {
    // 2. Hôm nay đã hết tiết hoặc không có lịch:
    // ĐẶC BIỆT: Nếu hôm nay là Chủ nhật (todayJsDay === 0 || currentDayNum === 1), ngày mai là Thứ 2 của TUẦN MỚI!
    const isSunday = todayJsDay === 0 || currentDayNum === 1;
    let tomorrowSchedule = [];

    if (isSunday && options.nextWeekSchedule && Array.isArray(options.nextWeekSchedule) && options.nextWeekSchedule.length > 0) {
      // Ưu tiên tìm Thứ 2 của tuần sau
      tomorrowSchedule = options.nextWeekSchedule.filter((c) => c.dayNum === 2);
      if (tomorrowSchedule.length === 0) {
        // Nếu Thứ 2 tuần sau không có tiết, tìm ngày tiếp theo trong tuần sau
        for (let d = 3; d <= 7; d++) {
          const match = options.nextWeekSchedule.filter((c) => c.dayNum === d);
          if (match.length > 0) {
            tomorrowSchedule = match;
            break;
          }
        }
      }
    } else {
      tomorrowSchedule = groupedByDay[tomorrowDayNum] || [];
    }

    if (tomorrowSchedule.length > 0) {
      const isNextWeekClass = isSunday && options.nextWeekSchedule && options.nextWeekSchedule.length > 0;
      nextClass = {
        subject: tomorrowSchedule[0].course,
        room: tomorrowSchedule[0].room,
        time: tomorrowSchedule[0].time,
        lecturer: tomorrowSchedule[0].lecturer,
        day: tomorrowSchedule[0].day,
        direction: tomorrowSchedule[0].direction,
        status: 'NEXT_DAY',
        statusLabel: isNextWeekClass ? `LỊCH HỌC ${tomorrowSchedule[0].day?.toUpperCase() || 'NGÀY MAI'} (TUẦN MỚI)` : 'NGÀY MAI',
        dayText: isNextWeekClass ? `Ngày mai (${tomorrowSchedule[0].day || 'Thứ Hai'})` : 'Ngày mai',
        isCustom: tomorrowSchedule[0].isCustom || false,
        note: tomorrowSchedule[0].note || '',
        type: tomorrowSchedule[0].type || 'chinh_khoa',
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
            isCustom: upcomingClasses[0].isCustom || false,
            note: upcomingClasses[0].note || '',
            type: upcomingClasses[0].type || 'chinh_khoa',
          };
          break;
        }
      }
    }
  }

  return {
    weekRange: weekRangeText || 'Từ ngày 28/09/2026 đến ngày 04/10/2026',
    days: daysWithDates,
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
  parseWeekRangeDates,
  normalizeDateVN,
  parseDateVN,
  getWeekRangeFromDate,
  getDayNameFromDate,
  filterCustomItemsForWeek,
};
