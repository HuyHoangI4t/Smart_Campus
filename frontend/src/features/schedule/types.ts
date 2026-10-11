import { Feather } from "@expo/vector-icons";

export interface DirectionStep {
  step: number;
  title: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
}

export interface RoomDirectionInfo {
  room: string;
  building: string;
  buildingCode: string;
  floor: string;
  mapQuery: string;
  steps: DirectionStep[];
  tips: string[];
}

export interface AvailableWeekItem {
  index: number;
  weekRange: string;
  label: string;
  isCurrent?: boolean;
  isNext?: boolean;
  schedules?: ScheduleItem[];
}

export interface WeekDateItem {
  num: number;
  label: string;
  dateStr: string;
  dateShort: string;
  dateObj: Date;
}

export type CustomScheduleType = "dot_xuat" | "hoc_bu" | "kiem_tra" | "khac";

export interface ScheduleItem {
  id: string | number;
  course: string;
  code: string;
  room: string;
  time: string;
  day: string;
  dayNum: number;
  lecturer: string;
  isCustom?: boolean;
  note?: string;
  type?: string;
  date?: string;
  dateShort?: string;
  ngay_hoc?: string;
  week_range?: string;
  direction?: RoomDirectionInfo;
}

