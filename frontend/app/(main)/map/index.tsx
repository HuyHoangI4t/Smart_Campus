import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";


// Danh sách các tòa nhà trọng điểm trong khuôn viên Đại học Tây Nguyên (567 Lê Duẩn, TP. Buôn Ma Thuột)
export interface LocationItem {
  id: number;
  name: string;
  category: string;
  building: string;
  floor: string;
  description: string;
  lat: number;
  lng: number;
  icon: string;
  x: number;
  y: number;
  color: string;
}

export const TAY_NGUYEN_CAMPUS_LOCATIONS: LocationItem[] = [
  {
    id: 1,
    name: "Tòa nhà Điều hành (Khu Hiệu bộ)",
    category: "Hành chính",
    building: "Tòa Hiệu Bộ",
    floor: "Tầng 1 - 7",
    description: "Ban Giám hiệu, Phòng Đào tạo, Phòng CTSV, Phòng Tài vụ...",
    lat: 12.65195,
    lng: 108.05335,
    icon: "briefcase",
    x: 76,
    y: 35,
    color: "#10B981"
  },
  {
    id: 2,
    name: "Nhà học số 2 - Khoa Ngoại ngữ & Khoa Lý luận chính trị",
    category: "Giảng đường",
    building: "Nhà học số 2",
    floor: "Tầng 1",
    description: "Khu vực giảng đường ngoại ngữ và lý luận chính trị.",
    lat: 12.65245,
    lng: 108.05405,
    icon: "book-open",
    x: 70,
    y: 35,
    color: "#8B5CF6"
  },
  {
    id: 3,
    name: "Phòng thí nghiệm Y khoa & Dược",
    category: "Phòng máy / Labs",
    building: "Khu Thí nghiệm Y Dược",
    floor: "Tầng 1 - 3",
    description: "Phòng thí nghiệm chuyên ngành Y và Dược.",
    lat: 12.65230,
    lng: 108.05380,
    icon: "cpu",
    x: 67,
    y: 35,
    color: "#06B6D4"
  },
  {
    id: 4,
    name: "Bệnh viện Trường Đại học Tây Nguyên",
    category: "Y tế",
    building: "Bệnh viện ĐH Tây Nguyên",
    floor: "Nhiều tầng",
    description: "Bệnh viện thực hành đa khoa, khám chữa bệnh.",
    lat: 12.65180,
    lng: 108.05250,
    icon: "activity",
    x: 75,
    y: 6,
    color: "#EF4444"
  },
  {
    id: 5,
    name: "Trung tâm Xét nghiệm Y khoa",
    category: "Y tế",
    building: "Trung tâm Xét nghiệm",
    floor: "Nhiều tầng",
    description: "Khu xét nghiệm y khoa chuyên sâu.",
    lat: 12.65190,
    lng: 108.05270,
    icon: "activity",
    x: 69,
    y: 13,
    color: "#EF4444"
  },
  {
    id: 6,
    name: "Nhà học số 5 - Khoa Y Dược",
    category: "Giảng đường",
    building: "Nhà học số 5",
    floor: "Tầng 1 - 4",
    description: "Giảng đường chính của Khoa Y Dược.",
    lat: 12.65228,
    lng: 108.05392,
    icon: "book-open",
    x: 56,
    y: 38,
    color: "#6366F1"
  },
  {
    id: 7,
    name: "Nhà học số 6",
    category: "Giảng đường",
    building: "Nhà học số 6",
    floor: "Tầng 1",
    description: "Khu giảng đường học tập chung.",
    lat: 12.65261,
    lng: 108.05371,
    icon: "layers",
    x: 86,
    y: 52,
    color: "#06B6D4"
  },
  {
    id: 8,
    name: "Nhà học số 7 - Khoa Kinh tế & Trung tâm Ngoại ngữ Tin học",
    category: "Giảng đường",
    building: "Nhà học số 7",
    floor: "Tầng 1 - 4",
    description: "Văn phòng Khoa Kinh tế, các phòng máy tính tin học.",
    lat: 12.65285,
    lng: 108.05485,
    icon: "book-open",
    x: 88,
    y: 63,
    color: "#F97316"
  },
  {
    id: 9,
    name: "Nhà học số 8 - Khoa Sư phạm",
    category: "Giảng đường",
    building: "Nhà học số 8",
    floor: "Tầng 1 - 4",
    description: "Khu giảng đường và văn phòng Khoa Sư phạm.",
    lat: 12.65215,
    lng: 108.05365,
    icon: "book-open",
    x: 89,
    y: 76,
    color: "#3B82F6"
  },
  {
    id: 10,
    name: "Nhà học số 9 - Khoa Khoa học Tự nhiên và Công nghệ",
    category: "Giảng đường",
    building: "Nhà học số 9",
    floor: "Tầng 1 - 4",
    description: "Phòng học, lab thực hành khối khoa học tự nhiên và công nghệ.",
    lat: 12.65285,
    lng: 108.05425,
    icon: "cpu",
    x: 73,
    y: 61,
    color: "#1E3A8A"
  },
  {
    id: 11,
    name: "Giảng đường 400 chỗ",
    category: "Giảng đường lớn",
    building: "Hội trường lớn",
    floor: "Tầng 1",
    description: "Phòng hội thảo, sinh hoạt chung sức chứa lớn.",
    lat: 12.65310,
    lng: 108.05450,
    icon: "award",
    x: 78,
    y: 71,
    color: "#F59E0B"
  },
  {
    id: 12,
    name: "Giảng đường 200 chỗ",
    category: "Giảng đường lớn",
    building: "Hội trường vừa",
    floor: "Tầng 1",
    description: "Phòng học lớn phục vụ hội nghị, báo cáo chuyên đề.",
    lat: 12.65090,
    lng: 108.05520,
    icon: "award",
    x: 75,
    y: 90,
    color: "#F59E0B"
  },
  {
    id: 13,
    name: "Viện Công nghệ Sinh học & Môi trường",
    category: "Nghiên cứu",
    building: "Viện CNSH & MT",
    floor: "Tầng 1 - 3",
    description: "Khu nghiên cứu khoa học và chuyển giao công nghệ sinh học.",
    lat: 12.65270,
    lng: 108.05460,
    icon: "cpu",
    x: 68,
    y: 56,
    color: "#10B981"
  },
  {
    id: 14,
    name: "Thư viện Trung tâm",
    category: "Học tập",
    building: "Tòa Thư viện",
    floor: "Tầng 1 - 2",
    description: "Kho sách, phòng đọc, tài liệu số.",
    lat: 12.65142,
    lng: 108.05415,
    icon: "book",
    x: 33,
    y: 54,
    color: "#F59E0B"
  },
  {
    id: 15,
    name: "Ký túc xá số 2",
    category: "Ký túc xá",
    building: "KTX 2",
    floor: "Tầng 1 - 4",
    description: "Khu lưu trú nội trú sinh viên.",
    lat: 12.65200,
    lng: 108.05510,
    icon: "home",
    x: 53,
    y: 88,
    color: "#8B5CF6"
  },
  {
    id: 16,
    name: "Trung tâm Ứng dụng và Tư vấn Kỹ thuật Nông Lâm nghiệp",
    category: "Nghiên cứu",
    building: "TT Ứng dụng Nông Lâm",
    floor: "Tầng 1 - 2",
    description: "Tư vấn kỹ thuật nông lâm nghiệp và chuyển giao giống.",
    lat: 12.65050,
    lng: 108.05200,
    icon: "layers",
    x: 28,
    y: 69,
    color: "#10B981"
  },
  {
    id: 17,
    name: "Khu đất ứng dụng và tư vấn kỹ thuật nông lâm nghiệp",
    category: "Thực nghiệm",
    building: "Khu thực nghiệm",
    floor: "Mặt đất",
    description: "Khu đất trồng trọt, thí nghiệm thực tế ngoài trời.",
    lat: 12.65020,
    lng: 108.05180,
    icon: "award",
    x: 39,
    y: 86,
    color: "#10B981"
  },
  {
    id: 18,
    name: "Trường Mầm non Thực hành 11-11",
    category: "Tiện ích",
    building: "Mầm non 11-11",
    floor: "Tầng 1 - 2",
    description: "Trường mầm non phục vụ con em cán bộ viên chức và nhân dân.",
    lat: 12.65120,
    lng: 108.05150,
    icon: "award",
    x: 13,
    y: 88,
    color: "#EC4899"
  },
  {
    id: 19,
    name: "Trường THPT Thực hành Cao Nguyên",
    category: "Giảng đường",
    building: "THPT Thực hành",
    floor: "Tầng 1 - 4",
    description: "Trường trung học phổ thông thực hành trực thuộc trường ĐH Tây Nguyên.",
    lat: 12.65080,
    lng: 108.05120,
    icon: "book-open",
    x: 14,
    y: 34,
    color: "#3B82F6"
  },
  {
    id: 20,
    name: "Trung tâm Giáo dục Quốc phòng và An ninh",
    category: "Học tập",
    building: "Trung tâm QP-AN",
    floor: "Tầng 1 - 4",
    description: "Khu học tập và huấn luyện quân sự sinh viên.",
    lat: 12.64980,
    lng: 108.05220,
    icon: "award",
    x: 27,
    y: 54,
    color: "#EF4444"
  },
  {
    id: 21,
    name: "Thao trường quân sự",
    category: "Thể thao / Huấn luyện",
    building: "Thao trường",
    floor: "Mặt đất",
    description: "Khu vực tập luyện nội dung giáo dục quốc phòng.",
    lat: 12.64950,
    lng: 108.05250,
    icon: "award",
    x: 35,
    y: 35,
    color: "#EF4444"
  },
  {
    id: 22,
    name: "Khu thể thao",
    category: "Tiện ích",
    building: "Khu Thể thao",
    floor: "Mặt đất",
    description: "Sân vận động, sân bóng đá ngoài trời.",
    lat: 12.65350,
    lng: 108.05320,
    icon: "award",
    x: 41,
    y: 24,
    color: "#EF4444"
  },
  {
    id: 23,
    name: "Nhà thi đấu thể thao",
    category: "Tiện ích",
    building: "Nhà thi đấu",
    floor: "Mặt đất",
    description: "Nhà thi đấu đa năng trong nhà.",
    lat: 12.65400,
    lng: 108.05280,
    icon: "award",
    x: 49,
    y: 19,
    color: "#EF4444"
  },
  {
    id: 24,
    name: "Hồ bơi",
    category: "Tiện ích",
    building: "Hồ bơi",
    floor: "Mặt đất",
    description: "Hồ bơi phục vụ rèn luyện và thể thao.",
    lat: 12.65420,
    lng: 108.05350,
    icon: "award",
    x: 51,
    y: 70,
    color: "#06B6D4"
  },
  {
    id: 25,
    name: "Toà nhà Thí nghiệm Khoa Nông nghiệp",
    category: "Nghiên cứu",
    building: "Lab Nông nghiệp",
    floor: "Tầng 1 - 3",
    description: "Khu phòng thí nghiệm chuyên ngành nông nghiệp.",
    lat: 12.65150,
    lng: 108.05480,
    icon: "cpu",
    x: 44,
    y: 70,
    color: "#10B981"
  },
  {
    id: 26,
    name: "Ký túc xá Lào - Campuchia",
    category: "Ký túc xá",
    building: "KTX Quốc tế",
    floor: "Tầng 1 - 3",
    description: "Khu lưu trú dành cho lưu học sinh Lào và Campuchia.",
    lat: 12.65120,
    lng: 108.05450,
    icon: "home",
    x: 43,
    y: 53,
    color: "#8B5CF6"
  },
  {
    id: 27,
    name: "Ký túc xá số 1",
    category: "Ký túc xá",
    building: "KTX 1",
    floor: "Tầng 1 - 4",
    description: "Khu nội trú sinh viên.",
    lat: 12.65210,
    lng: 108.05310,
    icon: "home",
    x: 15,
    y: 55,
    color: "#8B5CF6"
  },
  {
    id: 28,
    name: "Ký túc xá số 3",
    category: "Ký túc xá",
    building: "KTX 3",
    floor: "Tầng 1 - 4",
    description: "Khu nội trú sinh viên.",
    lat: 12.65220,
    lng: 108.05290,
    icon: "home",
    x: 9,
    y: 53,
    color: "#8B5CF6"
  },
  {
    id: 29,
    name: "Ký túc xá số 4",
    category: "Ký túc xá",
    building: "KTX 4",
    floor: "Tầng 1 - 4",
    description: "Khu nội trú sinh viên.",
    lat: 12.65230,
    lng: 108.05270,
    icon: "home",
    x: 51,
    y: 55,
    color: "#8B5CF6"
  },
  {
    id: 30,
    name: "Nhà khách",
    category: "Dịch vụ",
    building: "Nhà khách Đại học",
    floor: "Tầng 1 - 3",
    description: "Lưu trú cho chuyên gia, khách công tác.",
    lat: 12.65090,
    lng: 108.05380,
    icon: "home",
    x: 57,
    y: 54,
    color: "#F59E0B"
  },
  {
    id: 31,
    name: "Sân quần vợt",
    category: "Tiện ích",
    building: "Sân Tennis",
    floor: "Mặt đất",
    description: "Sân tennis phục vụ thể thao.",
    lat: 12.65060,
    lng: 108.05420,
    icon: "award",
    x: 67,
    y: 76,
    color: "#EF4444"
  },
  {
    id: 32,
    name: "Căng tin - Đảo sinh viên",
    category: "Dịch vụ",
    building: "Khu Căng tin",
    floor: "Tầng trệt",
    description: "Khu ăn uống, giải khát, sinh hoạt chung.",
    lat: 12.65115,
    lng: 108.05315,
    icon: "coffee",
    x: 89,
    y: 27,
    color: "#6366F1"
  },
  {
    id: 33,
    name: "Phòng trưng bày",
    category: "Văn hóa",
    building: "Nhà trưng bày",
    floor: "Tầng 1",
    description: "Khu trưng bày hiện vật, lịch sử phát triển trường.",
    lat: 12.65130,
    lng: 108.05350,
    icon: "book",
    x: 90,
    y: 36,
    color: "#3B82F6"
  },
  {
    id: 34,
    name: "Nhà bảo vệ",
    category: "Hành chính",
    building: "Trạm an ninh",
    floor: "Tầng trệt",
    description: "Trực gác an ninh cổng chính và khuôn viên.",
    lat: 12.65100,
    lng: 108.05500,
    icon: "briefcase",
    x: 23,
    y: 86,
    color: "#10B981"
  },
  {
    id: 35,
    name: "Trung tâm Kỹ năng Sư phạm",
    category: "Học tập",
    building: "TT Kỹ năng Sư phạm",
    floor: "Tầng 1 - 2",
    description: "Rèn luyện nghiệp vụ sư phạm cho sinh viên khối ngành giáo dục.",
    lat: 12.65160,
    lng: 108.05340,
    icon: "book-open",
    x: 92,
    y: 86,
    color: "#3B82F6"
  },
  {
    id: 36,
    name: "Gara ô tô",
    category: "Tiện ích",
    building: "Khu để xe",
    floor: "Tầng trệt",
    description: "Bãi đỗ xe ô tô của trường.",
    lat: 12.65040,
    lng: 108.05300,
    icon: "layers",
    x: 85,
    y: 18,
    color: "#64748B"
  },
  {
    id: 37,
    name: "Văn phòng Công đoàn trường & Văn phòng Đoàn Thanh niên",
    category: "Hành chính",
    building: "Khu Đoàn - Hội",
    floor: "Tầng 1 - 2",
    description: "Nơi làm việc của Ban Chấp hành Đoàn Thanh niên và Công đoàn trường.",
    lat: 12.65190,
    lng: 108.05360,
    icon: "briefcase",
    x: 81,
    y: 18,
    color: "#10B981"
  }
];

export interface ParsedCampusRoom {
  raw: string;
  buildingCode: string; // "Nhà 2", "Nhà 7", "Tòa B"
  buildingName: string; // "Giảng đường Nhà 2", "Giảng đường Nhà 7"
  floor: string;        // "Tầng 3", "Tầng 2"
  roomNumber: string;   // "Phòng 18", "Phòng 20"
  fullDisplay: string;  // "Nhà 7 • Tầng 3 • Phòng 18"
  routeGuide: string;   // "Cổng trường ➔ Sảnh Nhà 7 ➔ Lên Tầng 3 ➔ Phòng 18"
}

export function parseCampusRoom(roomRaw: string): ParsedCampusRoom {
  const raw = (roomRaw || "").trim();
  const upper = raw.toUpperCase();

  // 1. Dạng 3 phần: X.Y.Z (vd: 7.3.18 là Nhà 7, Tầng 3, Phòng 18)
  const match3 = upper.match(/^(\d+)\s*\.\s*(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
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
      buildingCode: bCode,
      buildingName: `Giảng đường ${bCode}`,
      floor: fText,
      roomNumber: rText,
      fullDisplay: `${bCode} • ${fText} • ${rText}`,
      routeGuide: `Cổng trường ➔ Sảnh ${bCode} ➔ Lên ${fText} ➔ ${rText}`,
    };
  }

  // 2. Dạng 2 phần: X.Z (vd: 2.20 là Nhà 2, Phòng 20; 2.20 (CLC) là Nhà 2, Phòng 20 (CLC))
  const match2 = upper.match(/^(\d+)\s*\.\s*([0-9A-Z_-]+)(.*)/i);
  if (match2) {
    const bNum = match2[1];
    const rNum = match2[2];
    const extra = match2[3] ? match2[3].trim() : "";
    const bCode = `Nhà ${bNum}`;
    const rText = `Phòng ${rNum}${extra ? ` ${extra}` : ""}`;
    const bName = `Giảng đường ${bCode}${extra.includes("CLC") ? " (Khu CLC)" : ""}`;
    return {
      raw,
      buildingCode: bCode,
      buildingName: bName,
      floor: "",
      roomNumber: rText,
      fullDisplay: `${bCode} • ${rText}`,
      routeGuide: `Cổng trường ➔ Sảnh ${bCode} ➔ Đến ${rText}`,
    };
  }

  // 3. Dạng chữ cái: B204, ENG-B204, A102, C102, LAB-03
  let bCode = "Tòa A";
  let bName = "Tòa A - Giảng đường chính";
  let fText = "Tầng 1";
  let rText = raw ? `Phòng ${raw}` : "Phòng học";

  if (upper.includes("LAB") || upper.includes("NET") || upper.includes("MÁY TÍNH") || (upper.includes("C") && !upper.includes("CLC"))) {
    bCode = "Tòa C";
    bName = "Tòa C - Trung tâm CNTT & Labs";
    const labMatch = upper.match(/(\d+)/);
    if (labMatch) {
      fText = `Tầng ${labMatch[1].length >= 2 ? labMatch[1][0] : "1"}`;
    }
  } else if (upper.includes("B") || upper.includes("ENG-B")) {
    bCode = "Tòa B";
    bName = "Tòa B - Khối Kỹ thuật";
    const bMatch = upper.match(/B\s*(\d+)/);
    if (bMatch && bMatch[1]) {
      fText = `Tầng ${bMatch[1][0]}`;
    }
  } else if (upper.includes("A") || upper.includes("ENG-A")) {
    bCode = "Tòa A";
    bName = "Tòa A - Khối Giảng đường chính";
    const aMatch = upper.match(/A\s*(\d+)/);
    if (aMatch && aMatch[1]) {
      fText = `Tầng ${aMatch[1][0]}`;
    }
  } else if (upper.includes("CLC")) {
    bCode = "Nhà 2";
    bName = "Giảng đường Nhà 2 (Khu CLC)";
    fText = "Tầng 2";
  }

  return {
    raw,
    buildingCode: bCode,
    buildingName: bName,
    floor: fText,
    roomNumber: rText,
    fullDisplay: `${bCode} • ${fText} • ${rText}`,
    routeGuide: `Cổng trường ➔ Sảnh ${bCode} ➔ Lên ${fText} ➔ ${rText}`,
  };
}

export function findLocationByRoomOrQuery(rawQuery: string, locs: LocationItem[]): LocationItem | null {
  if (!rawQuery || !locs || locs.length === 0) return null;
  const parsed = parseCampusRoom(rawQuery);
  const q = rawQuery.trim().toLowerCase();
  const upper = rawQuery.trim().toUpperCase();

  // 1. Khớp theo mã tòa nhà đã phân tích (vd: "Nhà 2", "Nhà 7", "Tòa B", "Tòa A", "Tòa C")
  if (parsed.buildingCode) {
    const byCode = locs.find(
      (l) =>
        l.building.toUpperCase() === parsed.buildingCode.toUpperCase() ||
        l.name.toUpperCase().includes(parsed.buildingCode.toUpperCase())
    );
    if (byCode) return byCode;
  }

  // 2. Khớp trực tiếp CLC
  if (upper.includes("CLC") || upper.includes("CHẤT LƯỢNG CAO")) {
    const clc = locs.find((l) => l.name.toUpperCase().includes("CLC") || l.building.toUpperCase().includes("CLC"));
    if (clc) return clc;
  }

  // 3. Khớp tên hoặc tòa nhà
  const byName = locs.find((l) => l.name.toLowerCase().includes(q) || l.building.toLowerCase().includes(q));
  if (byName) return byName;

  // 4. Khớp mô tả
  const byDesc = locs.find((l) => l.description && l.description.toLowerCase().includes(q));
  if (byDesc) return byDesc;

  return null;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất theo km
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

export default function MapScreen() {
  const params = useLocalSearchParams<{ search?: string; room?: string; subject?: string }>();

  const [targetRoom, setTargetRoom] = useState<string>(params.room ? String(params.room).trim() : "");
  const [targetSubject, setTargetSubject] = useState<string>(params.subject ? String(params.subject).trim() : "");
  const currentParsed = targetRoom ? parseCampusRoom(targetRoom) : null;
  const [search, setSearch] = useState<string>(() => {
    if (params.room) {
      const parsed = parseCampusRoom(String(params.room));
      return parsed.fullDisplay;
    }
    return params.search ? String(params.search).trim() : "";
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<LocationItem[]>(TAY_NGUYEN_CAMPUS_LOCATIONS);
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(() => {
    const initialQuery = params.room || params.search || "";
    if (initialQuery) {
      const matched = findLocationByRoomOrQuery(String(initialQuery), TAY_NGUYEN_CAMPUS_LOCATIONS);
      if (matched) return matched;
    }
    return TAY_NGUYEN_CAMPUS_LOCATIONS[1]; // Mặc định Tòa A
  });

  // State vị trí người dùng
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // Yêu cầu quyền vị trí và lấy tọa độ GPS
  const requestUserLocation = async (isManual = false) => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLoading(false);
        if (isManual) {
          Alert.alert(
            "Cấp quyền vị trí",
            "Ứng dụng cần quyền vị trí để hiển thị khoảng cách và dẫn đường từ vị trí của bạn.",
            [
              { text: "Bỏ qua", style: "cancel" },
              {
                text: "Mở cài đặt",
                onPress: () => {
                  if (Platform.OS === "ios") {
                    Linking.openURL("app-settings:");
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        }
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      if (isManual) {
        Alert.alert("Lỗi vị trí", "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS trên thiết bị.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  // Tự động xin quyền vị trí và lấy tọa độ ngay khi mở màn hình bản đồ
  useEffect(() => {
    requestUserLocation(false);
  }, []);

  useEffect(() => {
    const r = params.room ? String(params.room).trim() : "";
    const s = params.search ? String(params.search).trim() : "";
    const sub = params.subject ? String(params.subject).trim() : "";

    if (r) {
      setTargetRoom(r);
      const parsed = parseCampusRoom(r);
      setSearch(parsed.fullDisplay);
      const found = findLocationByRoomOrQuery(r, locations);
      if (found) {
        setSelectedLoc(found);
      }
    } else if (s) {
      setSearch(s);
      const found = findLocationByRoomOrQuery(s, locations);
      if (found) {
        setSelectedLoc(found);
      }
    }

    if (sub) {
      setTargetSubject(sub);
    }
  }, [params.room, params.search, params.subject, locations]);

  // Chỉ sử dụng dữ liệu khuôn viên Đại học Tây Nguyên — không merge với mẫu
  // (locations state được khởi tạo sẵn từ TAY_NGUYEN_CAMPUS_LOCATIONS)


  const searchResults = locations.filter((loc) => {
    if (!search.trim()) return false;
    const q = search.toLowerCase().trim();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.building.toLowerCase().includes(q) ||
      (loc.description && loc.description.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (search.trim() && locations.length > 0) {
      const found = findLocationByRoomOrQuery(search, locations);
      if (found) {
        setSelectedLoc(found);
      }
    }
  }, [search, locations]);

  const handleOpenExternalDirections = () => {
    if (!selectedLoc) return;
    const { lat, lng, name } = selectedLoc;
    const label = encodeURIComponent(name);

    if (userLocation) {
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const dest = `${lat},${lng}`;
      const dirUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`;
      Linking.openURL(dirUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
      return;
    }

    const url = Platform.select({
      ios: `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=18`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})&z=18`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.canOpenURL(url as string).then((supported) => {
      if (supported) {
        Linking.openURL(url as string);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* ─── TIÊU ĐỀ NAVHEADER ─────────────────────────────────────────── */}
      <NavHeader
        title="Bản đồ khuôn viên"
        subtitle="Đại học Tây Nguyên • Sơ đồ trực quan"
      />

      {/* ─── Ô TÌM KIẾM Ở TRÊN CÙNG (KHÔNG CÓ DANH MỤC) ───────────────────── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: AppColors.cardBg,
          borderBottomWidth: 1,
          borderColor: AppColors.cardBorder,
          zIndex: 99,
          position: "relative",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 14,
            backgroundColor: AppColors.muted,
          }}
        >
          <Feather name="search" size={18} color={AppColors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm kiếm tòa nhà, giảng đường, thư viện..."
            placeholderTextColor={AppColors.textMuted}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{ flex: 1, fontSize: 13, color: AppColors.text, height: "100%" }}
          />
          {search ? (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setShowSuggestions(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dropdown gợi ý tìm kiếm nổi */}
        {showSuggestions && search.trim().length > 0 && searchResults.length > 0 && (
          <View
            style={{
              position: "absolute",
              top: 58,
              left: 16,
              right: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              maxHeight: 250,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 10,
              borderWidth: 1,
              borderColor: AppColors.cardBorder,
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  onPress={() => {
                    setSelectedLoc(loc);
                    setSearch(loc.name);
                    setShowSuggestions(false);
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderColor: "#F1F5F9",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: loc.color || AppColors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Feather name="map-pin" size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }} numberOfLines={1}>
                      {loc.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: AppColors.textSecondary }} numberOfLines={1}>
                      {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ─── TOÀN BỘ PHẦN CÒN LẠI LÀ BẢN ĐỒ SƠ ĐỒ TRỰC QUAN (FLEX: 1) ──────── */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#F0F4FA",
          position: "relative",
          marginTop: 6,
          marginHorizontal: 12,
          marginBottom: 95, // Đẩy khung bản đồ lên trên thanh TabBar để không bị che
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#E2E8F0",
        }}
      >
        {/* Nút GPS định vị ở góc trên bên phải */}
        <TouchableOpacity
          onPress={() => requestUserLocation(true)}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1,
            borderColor: userLocation ? "#10B981" : "#E2E8F0",
          }}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : (
            <Feather
              name="navigation"
              size={18}
              color={userLocation ? "#10B981" : AppColors.primary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          )}
        </TouchableOpacity>

        {/* ─── NỘI DUNG SƠ ĐỒ CAMPUS ────────────────────────────────────────── */}
        <View style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}>
          {/* Ảnh bản đồ khuôn viên thật */}
          <Image
            source={require("../../../assets/images/campus_map.jpg")}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* Danh sách các Pin tòa nhà phân bổ trên sơ đồ */}
          {locations.map((loc) => {
            const isSelected = selectedLoc?.id === loc.id;
            return (
              <TouchableOpacity
                key={loc.id}
                onPress={() => setSelectedLoc(loc)}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  left: `${loc.x}%` as any,
                  top: `${loc.y}%` as any,
                  transform: [{ translateX: -18 }, { translateY: -18 }],
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                {/* Floating tooltip/label khi được chọn */}
                {isSelected && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 42,
                      alignSelf: "center",
                      backgroundColor: "#0F2964",
                      paddingHorizontal: 8,
                      paddingVertical: 3.5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.4)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 6,
                    }}
                  >
                    <Feather name="navigation" size={10} color="#93C5FD" />
                    <Text
                      style={{ color: "#FFFFFF", fontSize: 10.5, fontWeight: "800" }}
                      numberOfLines={1}
                    >
                      {currentParsed
                        ? `${currentParsed.buildingCode} - ${currentParsed.roomNumber}`
                        : loc.building}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: loc.color,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isSelected ? 3 : 2,
                    borderColor: "#FFFFFF",
                    shadowColor: loc.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 6,
                    elevation: isSelected ? 8 : 4,
                    transform: [{ scale: isSelected ? 1.25 : 1 }],
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── THẺ NỔI THÔNG TIN TÒA NHÀ ĐANG CHỌN (GÓC DƯỚI BẢN ĐỒ) ──────── */}
        {selectedLoc && (
          <View
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              right: 10,
              zIndex: 30,
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              borderRadius: 18,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {currentParsed ? (
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                    <View style={{ backgroundColor: "#2563EB", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: "900", color: "#FFFFFF" }}>
                        {currentParsed.buildingCode.toUpperCase()}
                      </Text>
                    </View>
                    {currentParsed.floor ? (
                      <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#2563EB" }}>
                          {currentParsed.floor}
                        </Text>
                      </View>
                    ) : null}
                    <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: "800", color: "#334155" }}>
                        {currentParsed.roomNumber}
                      </Text>
                    </View>
                    {userLocation && selectedLoc.lat && selectedLoc.lng ? (
                      <View style={{ backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Feather name="navigation" size={9} color="#059669" />
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                          Cách bạn {formatDistanceText(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedLoc.color || AppColors.primary }} />
                    <Text style={{ fontSize: 10, fontWeight: "800", color: selectedLoc.color || AppColors.primary }}>
                      {selectedLoc.category?.toUpperCase() || "TÒA NHÀ KHUÔN VIÊN"}
                    </Text>
                    {userLocation && selectedLoc.lat && selectedLoc.lng ? (
                      <View style={{ backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Feather name="navigation" size={9} color="#059669" />
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669" }}>
                          Cách bạn {formatDistanceText(userLocation.latitude, userLocation.longitude, selectedLoc.lat, selectedLoc.lng)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                <Text style={{ fontSize: 15, fontWeight: "900", color: AppColors.text }}>
                  {targetSubject ? targetSubject : (currentParsed ? currentParsed.buildingName : selectedLoc.name)}
                </Text>

                <Text style={{ fontSize: 12, color: AppColors.primary, fontWeight: "700", marginTop: 2 }}>
                  {currentParsed ? currentParsed.fullDisplay : `${selectedLoc.building}${selectedLoc.floor ? ` • ${selectedLoc.floor}` : ""}`}
                </Text>

                {currentParsed ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      backgroundColor: "#F8FAFC",
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 8,
                      marginTop: 6,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <Feather name="compass" size={12} color="#2563EB" />
                    <Text style={{ fontSize: 11, color: "#475569", fontWeight: "600", flex: 1 }}>
                      {currentParsed.routeGuide}
                    </Text>
                  </View>
                ) : selectedLoc.description ? (
                  <Text style={{ fontSize: 11, color: AppColors.textSecondary, marginTop: 4 }} numberOfLines={2}>
                    {selectedLoc.description}
                  </Text>
                ) : null}
              </View>

              {/* Cụm nút Chỉ đường và Đóng */}
              <View style={{ gap: 6, alignItems: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => setSelectedLoc(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={14} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenExternalDirections}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: AppColors.primary,
                  }}
                >
                  <Feather name="navigation" size={12} color="#FFFFFF" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Chỉ đường</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
