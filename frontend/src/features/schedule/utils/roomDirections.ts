import { DirectionStep, RoomDirectionInfo } from "../types";

/**
 * Phân tích và tạo lộ trình hướng dẫn từng bước đến phòng học
 */
export function parseRoomDirections(roomRaw: string): RoomDirectionInfo {
  const room = (roomRaw || "").trim();
  const upper = room.toUpperCase();

  let building = "Nhà học số 2";
  let buildingCode = "Nhà 2";
  let floor = "";
  let mapQuery = "Nhà 2";
  let roomDisplay = room || "Khu giảng đường";

  // 1. Dạng 3 phần: X.Y.Z (vd: 7.3.18 -> Nhà 7, Tầng 3, Phòng 18)
  const match3 = upper.match(/^(\d+)\s*\.\s*(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
  if (match3) {
    const bNum = match3[1];
    const fNum = match3[2];
    const rNum = match3[3];
    const extra = match3[4] ? match3[4].trim() : "";
    buildingCode = `Nhà ${bNum}`;
    building = `Nhà học số ${bNum}`;
    floor = `Tầng ${fNum}`;
    roomDisplay = `Phòng ${rNum}${extra ? ` ${extra}` : ""}`;
    mapQuery = buildingCode;
  } else {
    // 2. Dạng 2 phần: X.Z (vd: 2.20 -> Nhà 2, Phòng 20; 2.21 (CLC) -> Nhà 2, Phòng 21 (CLC))
    const match2 = upper.match(/^(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
    if (match2) {
      const bNum = match2[1];
      const rNum = match2[2];
      const extra = match2[3] ? match2[3].trim() : "";
      buildingCode = `Nhà ${bNum}`;
      building = `Nhà học số ${bNum}`;
      floor = "";
      roomDisplay = `Phòng ${rNum}${extra ? ` ${extra}` : ""}`;
      mapQuery = buildingCode;
    } else if (upper.includes("400")) {
      building = "Giảng đường 400 chỗ";
      buildingCode = "GĐ 400";
      mapQuery = "Giảng đường 400 chỗ";
      roomDisplay = "Hội trường lớn 400 chỗ";
    } else if (upper.includes("200")) {
      building = "Giảng đường 200 chỗ";
      buildingCode = "GĐ 200";
      mapQuery = "Giảng đường 200 chỗ";
      roomDisplay = "Hội trường vừa 200 chỗ";
    } else if (upper.includes("THƯ VIỆN") || upper.includes("THU VIEN")) {
      building = "Thư viện Trung tâm";
      buildingCode = "Thư viện";
      mapQuery = "Thư viện Trung tâm";
    } else if (upper.includes("QUỐC PHÒNG") || upper.includes("GDQP") || upper.includes("QP-AN")) {
      building = "Trung tâm Giáo dục Quốc phòng và An ninh";
      buildingCode = "TT GDQP";
      mapQuery = "Trung tâm Giáo dục Quốc phòng và An ninh";
    } else if (upper.includes("Y DƯỢC") || upper.includes("Y DUOC")) {
      building = "Nhà học số 5 - Khoa Y Dược";
      buildingCode = "Nhà 5";
      mapQuery = "Nhà học số 5";
    } else if (upper.includes("KINH TẾ") || upper.includes("KINH TE")) {
      building = "Nhà học số 7 - Khoa Kinh tế";
      buildingCode = "Nhà 7";
      mapQuery = "Nhà học số 7";
    } else if (upper.includes("SƯ PHẠM") || upper.includes("SU PHAM")) {
      building = "Nhà học số 8 - Khoa Sư phạm";
      buildingCode = "Nhà 8";
      mapQuery = "Nhà học số 8";
    } else if (upper.includes("CÔNG NGHỆ") || upper.includes("CNTT") || upper.includes("TỰ NHIÊN")) {
      building = "Nhà học số 9 - Khoa KHTN & Công nghệ";
      buildingCode = "Nhà 9";
      mapQuery = "Nhà học số 9";
    } else {
      const bMatch = upper.match(/NHÀ\s*(\d+)/i);
      if (bMatch) {
        buildingCode = `Nhà ${bMatch[1]}`;
        building = `Nhà học số ${bMatch[1]}`;
        mapQuery = buildingCode;
      }
    }
  }

  const steps: DirectionStep[] = [
    {
      step: 1,
      title: "Cổng trường",
      desc: `Từ cổng đi thẳng qua trục đường trung tâm hướng về phía ${buildingCode}.`,
      icon: "compass",
    },
    {
      step: 2,
      title: `Vào sảnh chính ${buildingCode}`,
      desc: `Bước vào sảnh chính ${buildingCode}, có thể tra cứu sơ đồ phân phòng tại bảng thông báo sảnh.`,
      icon: "home",
    },
  ];

  if (floor) {
    steps.push({
      step: 3,
      title: `Lên ${floor}`,
      desc: `Sử dụng thang bộ để di chuyển lên ${floor}.`,
      icon: "arrow-up-circle",
    });
    steps.push({
      step: 4,
      title: `Đến ${roomDisplay}`,
      desc: `Rẽ theo biển báo số phòng dọc hành lang ${floor}, ${roomDisplay} nằm ở vị trí tương ứng.`,
      icon: "map-pin",
    });
  } else {
    steps.push({
      step: 3,
      title: `Đến ${roomDisplay}`,
      desc: `Đi theo biển chỉ dẫn số phòng tại khu vực ${buildingCode}, ${roomDisplay} nằm ở vị trí tương ứng.`,
      icon: "map-pin",
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

