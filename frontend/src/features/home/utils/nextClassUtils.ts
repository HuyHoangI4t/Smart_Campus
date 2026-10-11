import { NextClassInfo } from "../types";

export function getPeriodMinutes(startPeriod: number, endPeriod: number) {
  const periodTimes: Record<number, { start: number; end: number }> = {
    1: { start: 7 * 60, end: 7 * 60 + 50 },
    2: { start: 7 * 60 + 50, end: 8 * 60 + 40 },
    3: { start: 8 * 60 + 50, end: 9 * 60 + 40 },
    4: { start: 9 * 60 + 50, end: 10 * 60 + 40 },
    5: { start: 10 * 60 + 40, end: 11 * 60 + 30 },
    6: { start: 13 * 60, end: 13 * 60 + 50 },
    7: { start: 13 * 60 + 50, end: 14 * 60 + 40 },
    8: { start: 14 * 60 + 50, end: 15 * 60 + 40 },
    9: { start: 15 * 60 + 50, end: 16 * 60 + 40 },
    10: { start: 16 * 60 + 40, end: 17 * 60 + 30 },
    11: { start: 17 * 60 + 45, end: 18 * 60 + 35 },
    12: { start: 18 * 60 + 35, end: 19 * 60 + 25 },
    13: { start: 19 * 60 + 35, end: 20 * 60 + 25 },
  };

  const start = periodTimes[startPeriod]?.start || 7 * 60;
  const end = periodTimes[endPeriod]?.end || (start + 90);
  return { startMinutes: start, endMinutes: end };
}

export function parseClassTimeRange(timeStr: string): { startMinutes: number; endMinutes: number } {
  const timeMatch = (timeStr || "").match(/(\d{1,2})[:h](\d{2})\s*[-–—]\s*(\d{1,2})[:h](\d{2})/i);
  if (timeMatch) {
    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);
    const endH = parseInt(timeMatch[3], 10);
    const endM = parseInt(timeMatch[4], 10);
    return {
      startMinutes: startH * 60 + startM,
      endMinutes: endH * 60 + endM,
    };
  }

  const periodMatch = (timeStr || "").match(/(\d{1,2})\s*[-–—,]\s*(\d{1,2})/);
  if (periodMatch) {
    const startP = parseInt(periodMatch[1], 10);
    const endP = parseInt(periodMatch[2], 10);
    return getPeriodMinutes(startP, endP);
  }

  const singlePeriodMatch = (timeStr || "").match(/tiết\s*(\d{1,2})/i);
  if (singlePeriodMatch) {
    const p = parseInt(singlePeriodMatch[1], 10);
    return getPeriodMinutes(p, p);
  }

  if ((timeStr || "").toLowerCase().includes("chiều") || (timeStr || "").toLowerCase().includes("tối")) {
    return { startMinutes: 13 * 60, endMinutes: 17 * 60 };
  }
  return { startMinutes: 7 * 60, endMinutes: 11 * 60 + 30 };
}

export function getDayNameFromNum(num: number): string {
  switch (num) {
    case 1: return "Chủ Nhật";
    case 2: return "Thứ Hai";
    case 3: return "Thứ Ba";
    case 4: return "Thứ Tư";
    case 5: return "Thứ Năm";
    case 6: return "Thứ Sáu";
    case 7: return "Thứ Bảy";
    default: return "Thứ Hai";
  }
}

export function computeNextClass(rawSchedules: any[]): NextClassInfo | null {
  if (!rawSchedules || rawSchedules.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const jsDay = now.getDay();
  const todayNum = jsDay === 0 ? 1 : jsDay + 1; // 1 (CN), 2 (T2), ..., 7 (T7)
  const tomorrowNum = (todayNum % 7) + 1; // Thứ ngày mai (1..7)

  const normalized = rawSchedules.map((item, idx) => {
    let dayNum = item.dayNum;
    if (!dayNum) {
      const lowerDay = (item.day || item.code || item.thu || "").toLowerCase();
      if (lowerDay.includes("thứ 3") || lowerDay.includes("thứ ba")) dayNum = 3;
      else if (lowerDay.includes("thứ 4") || lowerDay.includes("thứ tư")) dayNum = 4;
      else if (lowerDay.includes("thứ 5") || lowerDay.includes("thứ năm")) dayNum = 5;
      else if (lowerDay.includes("thứ 6") || lowerDay.includes("thứ sáu")) dayNum = 6;
      else if (lowerDay.includes("thứ 7") || lowerDay.includes("thứ bảy")) dayNum = 7;
      else if (lowerDay.includes("chủ nhật") || lowerDay.includes("cn")) dayNum = 1;
      else if (lowerDay.includes("thứ 2") || lowerDay.includes("thứ hai")) dayNum = 2;
      else dayNum = 2;
    }

    const timeStr = item.time || (item.tiet ? `Tiết ${item.tiet}` : "");
    const range = parseClassTimeRange(timeStr);

    const rawTiet = item.tiet || item.period || "";
    let periodText = "";
    if (rawTiet) {
      periodText = String(rawTiet).startsWith("Tiết") ? String(rawTiet) : `Tiết ${rawTiet}`;
    } else if (timeStr) {
      const match = timeStr.match(/tiết\s*([\d\s*–—-]+)/i);
      if (match) {
        periodText = `Tiết ${match[1].replace(/\s+/g, "")}`;
      } else {
        const rangeMatch = timeStr.match(/(\d+)\s*[-–—]\s*(\d+)/);
        if (rangeMatch) {
          periodText = `Tiết ${rangeMatch[1]}-${rangeMatch[2]}`;
        } else {
          periodText = timeStr.startsWith("Tiết") ? timeStr : `Tiết ${timeStr}`;
        }
      }
    } else {
      periodText = "Tiết 1-4";
    }

    return {
      id: item.id || idx,
      subject: item.course || item.subject || item.ten_hp || "Môn học",
      room: item.room || item.phong || "Khu giảng đường",
      time: periodText,
      period: periodText,
      dayNum,
      day: item.day || item.code || item.thu || `Thứ ${dayNum}`,
      startMinutes: range.startMinutes,
      endMinutes: range.endMinutes,
      lecturer: item.lecturer || item.giang_vien || "",
    };
  });

  // 1. Kiểm tra các môn của NGÀY HÔM NAY (todayNum)
  const todayClasses = normalized
    .filter((c) => c.dayNum === todayNum)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // 1A. Môn ĐANG TRONG GIỜ HỌC
  const inProgressClass = todayClasses.find(
    (c) => currentMinutes >= c.startMinutes && currentMinutes <= c.endMinutes
  );
  if (inProgressClass) {
    return {
      subject: inProgressClass.subject,
      room: inProgressClass.room,
      time: inProgressClass.time,
      lecturer: inProgressClass.lecturer,
      dayText: "Hôm nay",
      status: "IN_PROGRESS",
      statusLabel: "ĐANG TRONG GIỜ HỌC",
      statusBadgeColor: "#10B981", // Xanh lá
    };
  }

  // 1B. Hôm nay còn môn chưa học (Lớp kế tiếp hôm nay)
  const upcomingTodayClass = todayClasses.find(
    (c) => currentMinutes < c.startMinutes
  );
  if (upcomingTodayClass) {
    return {
      subject: upcomingTodayClass.subject,
      room: upcomingTodayClass.room,
      time: upcomingTodayClass.time,
      lecturer: upcomingTodayClass.lecturer,
      dayText: "Hôm nay",
      status: "UPCOMING_TODAY",
      statusLabel: "LỚP HỌC KẾ TIẾP",
      statusBadgeColor: "#3B82F6", // Xanh dương
    };
  }

  // 2. NẾU ĐÃ HẾT GIỜ HỌC HÔM NAY HOẶC HÔM NAY KHÔNG CÓ LỊCH:
  // ƯU TIÊN HIỂN THỊ NGÀY MAI
  const tomorrowClasses = normalized
    .filter((c) => c.dayNum === tomorrowNum)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (tomorrowClasses.length > 0) {
    const firstTomorrowClass = tomorrowClasses[0];
    const tomorrowDayName = getDayNameFromNum(tomorrowNum);
    return {
      subject: firstTomorrowClass.subject,
      room: firstTomorrowClass.room,
      time: firstTomorrowClass.time,
      lecturer: firstTomorrowClass.lecturer,
      dayText: "Ngày mai",
      status: "NEXT_DAY",
      statusLabel: `NGÀY MAI (${tomorrowDayName.toUpperCase()})`,
      statusBadgeColor: "#A855F7", // Tím
    };
  }

  // 3. Nếu ngày mai không có tiết, tìm ngày tiếp theo gần nhất
  for (let offset = 2; offset <= 7; offset++) {
    const nextDayNum = ((todayNum - 1 + offset) % 7) + 1;
    const nextDayClasses = normalized
      .filter((c) => c.dayNum === nextDayNum)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    if (nextDayClasses.length > 0) {
      const firstClassNextDay = nextDayClasses[0];
      const dayName = getDayNameFromNum(nextDayNum);

      return {
        subject: firstClassNextDay.subject,
        room: firstClassNextDay.room,
        time: firstClassNextDay.time,
        lecturer: firstClassNextDay.lecturer,
        dayText: dayName,
        status: "NEXT_DAY",
        statusLabel: `LỊCH HỌC ${dayName.toUpperCase()}`,
        statusBadgeColor: "#8B5CF6", // Tím
      };
    }
  }

  return null;
}

