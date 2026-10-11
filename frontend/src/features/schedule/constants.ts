import { ScheduleItem } from "./types";

export const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { id: '1', course: "Lập trình thiết bị di động", code: "Thứ 2", room: "9.2.04", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 2", dayNum: 2, lecturer: "TS. Hoàng Minh" },
  { id: '2', course: "Lịch sử Đảng Cộng sản VN", code: "Thứ 3", room: "2.21 (CLC)", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 3", dayNum: 3, lecturer: "ThS. Đoàn Văn Kỳ" },
  { id: '3', course: "Cấu trúc dữ liệu & Giải thuật", code: "Thứ 4", room: "9.3.01", time: "Tiết 7-10 (13:50 – 17:30)", day: "Thứ 4", dayNum: 4, lecturer: "ThS. Lê Thị B" },
  { id: '4', course: "Hệ cơ sở dữ liệu", code: "Thứ 5", room: "7.3.18", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 5", dayNum: 5, lecturer: "TS. Nguyễn C" },
  { id: '5', course: "Mạng máy tính", code: "Thứ 6", room: "9.1.02", time: "Tiết 7-10 (13:50 – 17:30)", day: "Thứ 6", dayNum: 6, lecturer: "ThS. Phạm D" },
  { id: '6', course: "Ngoại ngữ chuyên ngành", code: "Thứ 7", room: "2.20", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 7", dayNum: 7, lecturer: "Khoa Ngoại ngữ" },
];

export const DAYS = [
  { label: "Thứ 2", num: 2 },
  { label: "Thứ 3", num: 3 },
  { label: "Thứ 4", num: 4 },
  { label: "Thứ 5", num: 5 },
  { label: "Thứ 6", num: 6 },
  { label: "Thứ 7", num: 7 },
  { label: "CN", num: 1 },
];

export const PERIOD_OPTIONS = [
  { label: "Tiết 1-2", desc: "07:00 – 08:40" },
  { label: "Tiết 1-4", desc: "07:00 – 10:40" },
  { label: "Tiết 3-4", desc: "08:50 – 10:40" },
  { label: "Tiết 5-6", desc: "10:50 – 12:30" },
  { label: "Tiết 7-8", desc: "13:50 – 15:30" },
  { label: "Tiết 7-10", desc: "13:50 – 17:30" },
  { label: "Tiết 9-10", desc: "15:40 – 17:30" },
  { label: "Tiết 11-12", desc: "17:40 – 19:20" },
];

export const SCHEDULE_TYPE_OPTIONS = [
  { key: "dot_xuat", label: "Thực hành", icon: "activity", color: "#D97706", bg: "#FEF3C7", lightBg: "#FFFBEB" },
  { key: "hoc_bu", label: "Học bù", icon: "zap", color: "#2563EB", bg: "#EFF6FF", lightBg: "#EFF6FF" },
  { key: "kiem_tra", label: "Kiểm tra / Thi", icon: "file-text", color: "#DC2626", bg: "#FEE2E2", lightBg: "#FEF2F2" },
  { key: "khac", label: "Khác", icon: "bookmark", color: "#059669", bg: "#D1FAE5", lightBg: "#F0FDF4" },
] as const;

