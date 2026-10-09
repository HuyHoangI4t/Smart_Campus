import { LocationItem, ParsedCampusRoom } from "./types";

export const HOUSE_NUM_TO_ID: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
};

export function removeVietnameseTones(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function parseCampusRoom(roomRaw: string): ParsedCampusRoom {
  const raw = (roomRaw || "").trim();
  if (!raw) {
    return {
      raw: "",
      buildingNumber: "",
      buildingCode: "",
      buildingName: "",
      floor: "",
      roomNumber: "",
      fullDisplay: "",
      routeGuide: "",
    };
  }

  const upper = raw.toUpperCase();
  const norm = removeVietnameseTones(upper);

  // Chuẩn hóa chuỗi bằng cách loại bỏ các tiền tố thông dụng như "Phòng", "PHONG", "P.", "P ",...
  const cleanStr = norm.replace(/^(?:PHONG|P\.|PH\.|P)\s*/i, "").trim();

  // 1. Dạng 3 phần: <Nhà>.<Tầng>.<Phòng> (Ví dụ: 8.3.4, 7.3.18, 5.1.2, 9.2.1)
  const match3 = cleanStr.match(/^(\d+)\s*\.\s*(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
  if (match3) {
    const bNum = match3[1];
    const fNum = match3[2];
    const rNum = match3[3];
    const extra = match3[4] ? match3[4].trim() : "";
    const bCode = `Nhà ${bNum}`;
    const fText = `Tầng ${fNum}`;
    const rText = `Phòng ${rNum}${extra ? ` ${extra}` : ""}`;
    return {
      raw,
      buildingNumber: bNum,
      buildingCode: bCode,
      buildingName: `Nhà học số ${bNum}`,
      floor: fText,
      roomNumber: rText,
      fullDisplay: `${bCode} • ${fText} • ${rText}`,
      routeGuide: `Cổng trường ➔ Sảnh ${bCode} ➔ Lên ${fText} ➔ ${rText}`,
    };
  }

  // 2. Dạng 2 phần: <Nhà>.<Phòng> (Ví dụ: 2.20, 2.21, 6.01, 1.2, 5.12)
  const match2 = cleanStr.match(/^(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
  if (match2) {
    const bNum = match2[1];
    const rNum = match2[2];
    const extra = match2[3] ? match2[3].trim() : "";
    const bCode = `Nhà ${bNum}`;
    let fText = "";
    if (rNum.length >= 2 && !isNaN(Number(rNum))) {
      const firstDigit = rNum[0];
      if (firstDigit !== "0") {
        fText = `Tầng ${firstDigit}`;
      }
    }
    const rText = `Phòng ${rNum}${extra ? ` ${extra}` : ""}`;
    const bName = `Nhà học số ${bNum}${extra.includes("CLC") ? " (Khu CLC)" : ""}`;
    return {
      raw,
      buildingNumber: bNum,
      buildingCode: bCode,
      buildingName: bName,
      floor: fText,
      roomNumber: rText,
      fullDisplay: fText ? `${bCode} • ${fText} • ${rText}` : `${bCode} • ${rText}`,
      routeGuide: fText
        ? `Cổng trường ➔ Sảnh ${bCode} ➔ Lên ${fText} ➔ ${rText}`
        : `Cổng trường ➔ Sảnh ${bCode} ➔ Đến ${rText}`,
    };
  }

  // 3. Dạng đảo ngược: <Phòng>.<Nhà> hoặc <Phòng>/<Nhà> (Ví dụ: 304.GD3, 304.GD8, 204 GD2, 204-GD2)
  const revMatch = cleanStr.match(/^([0-9A-Z_-]+)\s*(?:[.\/\-_]|\s+)\s*(?:GD|GĐ|NHA)\s*(\d+)/i);
  if (revMatch) {
    const rNum = revMatch[1];
    const bNum = revMatch[2];
    const bCode = `Nhà ${bNum}`;
    let fText = "";
    if (rNum.length >= 3 && !isNaN(Number(rNum))) {
      fText = `Tầng ${rNum[0]}`;
    }
    const rText = `Phòng ${rNum}`;
    return {
      raw,
      buildingNumber: bNum,
      buildingCode: bCode,
      buildingName: `Nhà học số ${bNum}`,
      floor: fText,
      roomNumber: rText,
      fullDisplay: fText ? `${bCode} • ${fText} • ${rText}` : `${bCode} • ${rText}`,
      routeGuide: fText
        ? `Cổng trường ➔ Sảnh ${bCode} ➔ Lên ${fText} ➔ ${rText}`
        : `Cổng trường ➔ Sảnh ${bCode} ➔ Đến ${rText}`,
    };
  }

  // 4. Dạng tên nhà trực tiếp: Nhà 2, Nhà 8, GD2, GD8, Giảng đường 2,...
  const simpleHouseMatch = cleanStr.match(/^(?:NHA\s*(?:HOC\s*SO\s*|SO\s*)?|GD\s*|GIANG\s*DUONG\s*(?:SO\s*)?)(\d+)/i);
  if (simpleHouseMatch) {
    const bNum = simpleHouseMatch[1];
    const bCode = `Nhà ${bNum}`;
    return {
      raw,
      buildingNumber: bNum,
      buildingCode: bCode,
      buildingName: `Nhà học số ${bNum}`,
      floor: "",
      roomNumber: "",
      fullDisplay: bCode,
      routeGuide: `Cổng trường ➔ Sảnh ${bCode}`,
    };
  }

  let bNum = "";
  let bCode = "";
  let bName = "";
  let fText = "";
  let rText = raw;

  if (upper.includes("400")) {
    bCode = "GĐ 400";
    bName = "Giảng đường 400 chỗ";
    rText = "Hội trường lớn";
  } else if (upper.includes("200")) {
    bCode = "GĐ 200";
    bName = "Giảng đường 200 chỗ";
    rText = "Hội trường vừa";
  } else if (upper.includes("THƯ VIỆN") || upper.includes("THU VIEN")) {
    bCode = "Thư viện";
    bName = "Thư viện Trung tâm";
    rText = "Khu đọc & Tra cứu";
  } else if (upper.includes("HIỆU BỘ") || upper.includes("ĐIỀU HÀNH") || upper.includes("HIEU BO")) {
    bCode = "Tòa Hiệu Bộ";
    bName = "Tòa nhà Điều hành (Khu Hiệu bộ)";
    rText = "Khu Hành chính";
  } else if (upper.includes("Y DƯỢC") || upper.includes("Y DUOC")) {
    bNum = "5";
    bCode = "Nhà 5";
    bName = "Nhà học số 5 - Khoa Y Dược";
  } else if (upper.includes("KINH TẾ") || upper.includes("KINH TE")) {
    bNum = "7";
    bCode = "Nhà 7";
    bName = "Nhà học số 7 - Khoa Kinh tế";
  } else if (upper.includes("SƯ PHẠM") || upper.includes("SU PHAM")) {
    bNum = "8";
    bCode = "Nhà 8";
    bName = "Nhà học số 8 - Khoa Sư phạm";
  } else if (upper.includes("CÔNG NGHỆ") || upper.includes("CNTT") || upper.includes("TỰ NHIÊN")) {
    bNum = "9";
    bCode = "Nhà 9";
    bName = "Nhà học số 9 - Khoa KHTN & Công nghệ";
  } else {
    const numMatch =
      norm.match(/^(?:PHONG\s*|P\s*\.?\s*)?(\d+)\s*\./i) ||
      norm.match(/NHA\s*(?:HOC\s*SO\s*)?(\d+)/i) ||
      norm.match(/GD\s*(?:[.\s\-_]*)?(\d+)/i) ||
      norm.match(/GIANG\s*DUONG\s*(?:SO\s*)?(\d+)/i);
    if (numMatch) {
      bNum = numMatch[1];
      bCode = `Nhà ${bNum}`;
      bName = `Nhà học số ${bNum}`;
    }
  }

  const fullDisplay = [bCode, fText, rText].filter(Boolean).join(" • ");
  const routeGuide = bCode ? `Cổng trường ➔ Sảnh ${bCode} ➔ ${rText || "Phòng học"}` : raw;

  return {
    raw,
    buildingNumber: bNum,
    buildingCode: bCode,
    buildingName: bName,
    floor: fText,
    roomNumber: rText,
    fullDisplay,
    routeGuide,
  };
}

export function findLocationByRoomOrQuery(rawQuery: string, locs: LocationItem[]): LocationItem | null {
  if (!rawQuery || !locs || locs.length === 0) return null;
  const q = rawQuery.trim().toLowerCase();
  const upper = rawQuery.trim().toUpperCase();
  const norm = removeVietnameseTones(upper);

  // 1. Phân tích phòng học trước (Ưu tiên cao nhất: 2.20 -> Nhà 2, 8.3.4 -> Nhà 8)
  const parsed = parseCampusRoom(rawQuery);
  if (parsed.buildingNumber && HOUSE_NUM_TO_ID[parsed.buildingNumber]) {
    const targetId = HOUSE_NUM_TO_ID[parsed.buildingNumber];
    const byId = locs.find((l) => l.id === targetId);
    if (byId) return byId;
  }

  // 2. Nếu người dùng nhập thuần túy số ID (1 - 42) không chứa dấu chấm
  const idNum = parseInt(q, 10);
  if (!isNaN(idNum) && idNum >= 1 && idNum <= 42 && !q.includes(".") && !q.includes("-") && !q.includes("/")) {
    const byId = locs.find((l) => l.id === idNum);
    if (byId) return byId;
  }

  // 2.1 Tìm kiếm Nhà vệ sinh / WC
  if (upper.includes("WC") || upper.includes("VỆ SINH") || upper.includes("VE SINH") || upper.includes("TOILET")) {
    const wcLoc = locs.find((l) => l.category.toLowerCase() === "wc");
    if (wcLoc) return wcLoc;
  }

  // 3. Giảng đường 400 và 200
  if (norm.includes("400")) return locs.find((l) => l.id === 10) || null;
  if (norm.includes("200")) return locs.find((l) => l.id === 11) || null;

  // 4. Trích xuất số tòa nhà bằng Regex (Nhà 1 - 9, GĐ 1 - 9, Giảng đường 1 - 9,...)
  const numMatch =
    norm.match(/^(?:PHONG\s*|P\s*\.?\s*)?(\d+)\s*\./i) ||
    norm.match(/NHA\s*(?:HOC\s*SO\s*)?(\d+)/i) ||
    norm.match(/GD\s*(?:[.\s\-_]*)?(\d+)/i) ||
    norm.match(/GIANG\s*DUONG\s*(?:SO\s*)?(\d+)/i);

  if (numMatch && HOUSE_NUM_TO_ID[numMatch[1]]) {
    const targetId = HOUSE_NUM_TO_ID[numMatch[1]];
    const byId = locs.find((l) => l.id === targetId);
    if (byId) return byId;
  }

  if (upper.includes("SINH HỌC") || upper.includes("CNSH")) return locs.find((l) => l.id === 12) || null;
  if (upper.includes("THƯ VIỆN") || upper.includes("THU VIEN")) return locs.find((l) => l.id === 13) || null;
  if (upper.includes("KTX 2") || upper.includes("KTX SỐ 2")) return locs.find((l) => l.id === 14) || null;
  if (upper.includes("NÔNG LÂM") || upper.includes("TT NÔNG LÂM")) return locs.find((l) => l.id === 15) || null;
  if (upper.includes("ĐẤT") || upper.includes("VƯỜN THỰC VẬT")) return locs.find((l) => l.id === 16) || null;
  if (upper.includes("MẦM NON") || upper.includes("11-11")) return locs.find((l) => l.id === 17) || null;
  if (upper.includes("CAO NGUYÊN") || upper.includes("THPT")) return locs.find((l) => l.id === 18) || null;
  if (upper.includes("QUỐC PHÒNG") || upper.includes("GDQP") || upper.includes("QP-AN")) return locs.find((l) => l.id === 19) || null;
  if (upper.includes("THAO TRƯỜNG") || upper.includes("THAO TRUONG")) return locs.find((l) => l.id === 20) || null;
  if (upper.includes("THỂ THAO") || upper.includes("SÂN VẬN ĐỘNG") || upper.includes("SAN VAN DONG")) return locs.find((l) => l.id === 21) || null;
  if (upper.includes("THI ĐẤU") || upper.includes("THI DAU")) return locs.find((l) => l.id === 22) || null;
  if (upper.includes("HỒ BƠI") || upper.includes("HO BOI")) return locs.find((l) => l.id === 23) || null;
  if (upper.includes("LAB NÔNG NGHIỆP") || upper.includes("TN NÔNG NGHIỆP")) return locs.find((l) => l.id === 24) || null;
  if (upper.includes("LÀO") || upper.includes("CAMPUCHIA") || upper.includes("CPC")) return locs.find((l) => l.id === 25) || null;
  if (upper.includes("KTX 1") || upper.includes("KTX SỐ 1")) return locs.find((l) => l.id === 26) || null;
  if (upper.includes("KTX 3") || upper.includes("KTX SỐ 3")) return locs.find((l) => l.id === 27) || null;
  if (upper.includes("KTX 4") || upper.includes("KTX SỐ 4")) return locs.find((l) => l.id === 28) || null;
  if (upper.includes("NHÀ KHÁCH") || upper.includes("NHA KHACH")) return locs.find((l) => l.id === 29) || null;
  if (upper.includes("QUẦN VỢT") || upper.includes("TENNIS")) return locs.find((l) => l.id === 30) || null;
  if (upper.includes("CĂNG TIN") || upper.includes("CĂN TIN") || upper.includes("ĐẢO")) return locs.find((l) => l.id === 31) || null;
  if (upper.includes("TRƯNG BÀY") || upper.includes("TRUYỀN THỐNG")) return locs.find((l) => l.id === 32) || null;
  if (upper.includes("BẢO VỆ") || upper.includes("BAO VE")) return locs.find((l) => l.id === 33) || null;
  if (upper.includes("KỸ NĂNG") || upper.includes("KY NANG")) return locs.find((l) => l.id === 34) || null;
  if (upper.includes("GARA") || upper.includes("BÃI XE") || upper.includes("ĐỖ XE")) return locs.find((l) => l.id === 35) || null;
  if (upper.includes("CÔNG ĐOÀN") || upper.includes("CONG DOAN")) return locs.find((l) => l.id === 36) || null;
  if (upper.includes("ĐOÀN THANH NIÊN") || upper.includes("DOAN THANH NIEN") || upper.includes("HỘI SINH VIÊN")) return locs.find((l) => l.id === 37) || null;

  if (upper.includes("HIỆU BỘ") || upper.includes("HIEU BO") || upper.includes("ĐIỀU HÀNH")) return locs.find((l) => l.id === 1) || null;
  if (upper.includes("BỆNH VIỆN") || upper.includes("BENH VIEN") || upper.includes("XÉT NGHIỆM")) return locs.find((l) => l.id === 4) || null;
  if (upper.includes("Y DƯỢC") || upper.includes("Y DUOC")) return locs.find((l) => l.id === 5) || null;
  if (upper.includes("CLC")) return locs.find((l) => l.id === 2) || null;

  const byName = locs.find((l) => l.name.toLowerCase().includes(q) || l.building.toLowerCase().includes(q));
  if (byName) return byName;

  const byDesc = locs.find((l) => l.description && l.description.toLowerCase().includes(q));
  if (byDesc) return byDesc;

  return null;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistanceText(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const km = calculateDistanceKm(lat1, lon1, lat2, lon2);
  if (km < 1) {
    return `~${Math.round(km * 1000)}m`;
  }
  return `~${km.toFixed(1)}km`;
}

