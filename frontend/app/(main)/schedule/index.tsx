import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import {
  apiGetSchedule,
  readLocalCache,
  apiCreateCustomSchedule,
  apiUpdateCustomSchedule,
  apiDeleteCustomSchedule,
} from "../../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTabBarScrollHandler } from "../../../src/components/MainTabs";
import { SkeletonBox } from "../../../src/components/Skeleton";

interface DirectionStep {
  step: number;
  title: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
}

interface RoomDirectionInfo {
  room: string;
  building: string;
  buildingCode: string;
  floor: string;
  mapQuery: string;
  steps: DirectionStep[];
  tips: string[];
}

interface AvailableWeekItem {
  index: number;
  weekRange: string;
  label: string;
  isCurrent?: boolean;
  isNext?: boolean;
  schedules?: ScheduleItem[];
}

interface ScheduleItem {
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
  direction?: RoomDirectionInfo;
}

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

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { id: '1', course: "Lập trình thiết bị di động", code: "Thứ 2", room: "9.2.04", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 2", dayNum: 2, lecturer: "TS. Hoàng Minh" },
  { id: '2', course: "Lịch sử Đảng Cộng sản VN", code: "Thứ 3", room: "2.21 (CLC)", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 3", dayNum: 3, lecturer: "ThS. Đoàn Văn Kỳ" },
  { id: '3', course: "Cấu trúc dữ liệu & Giải thuật", code: "Thứ 4", room: "9.3.01", time: "Tiết 7-10 (13:50 – 17:30)", day: "Thứ 4", dayNum: 4, lecturer: "ThS. Lê Thị B" },
  { id: '4', course: "Hệ cơ sở dữ liệu", code: "Thứ 5", room: "7.3.18", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 5", dayNum: 5, lecturer: "TS. Nguyễn C" },
  { id: '5', course: "Mạng máy tính", code: "Thứ 6", room: "9.1.02", time: "Tiết 7-10 (13:50 – 17:30)", day: "Thứ 6", dayNum: 6, lecturer: "ThS. Phạm D" },
  { id: '6', course: "Ngoại ngữ chuyên ngành", code: "Thứ 7", room: "2.20", time: "Tiết 1-4 (07:00 – 10:40)", day: "Thứ 7", dayNum: 7, lecturer: "Khoa Ngoại ngữ" },
];

const DAYS = [
  { label: "Thứ 2", num: 2 },
  { label: "Thứ 3", num: 3 },
  { label: "Thứ 4", num: 4 },
  { label: "Thứ 5", num: 5 },
  { label: "Thứ 6", num: 6 },
  { label: "Thứ 7", num: 7 },
  { label: "CN", num: 1 },
];

const PERIOD_OPTIONS = [
  { label: "Tiết 1-2", desc: "07:00 – 08:40" },
  { label: "Tiết 1-4", desc: "07:00 – 10:40" },
  { label: "Tiết 3-4", desc: "08:50 – 10:40" },
  { label: "Tiết 5-6", desc: "10:50 – 12:30" },
  { label: "Tiết 7-8", desc: "13:50 – 15:30" },
  { label: "Tiết 7-10", desc: "13:50 – 17:30" },
  { label: "Tiết 9-10", desc: "15:40 – 17:30" },
  { label: "Tiết 11-12", desc: "17:40 – 19:20" },
];

const getTodayDayNum = () => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 1 : jsDay + 1; // 1: CN, 2: T2, 3: T3, 4: T4...
};

export default function ScheduleScreen() {
  const router = useRouter();
  const { onScroll: onTabBarScroll, bottomPadding } = useTabBarScrollHandler();
  const todayDayNum = getTodayDayNum();
  const [selectedDay, setSelectedDay] = useState(todayDayNum);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(FALLBACK_SCHEDULE);
  const [studentInfo, setStudentInfo] = useState<{ mssv: string; name: string }>({ mssv: "", name: "" });
  const [weekRangeText, setWeekRangeText] = useState("Từ ngày 28/09/2026 đến ngày 04/10/2026");
  const [availableWeeks, setAvailableWeeks] = useState<AvailableWeekItem[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [nextWeekIndex, setNextWeekIndex] = useState<number>(1);
  const [isSunday, setIsSunday] = useState<boolean>(new Date().getDay() === 0);
  const [selectedScheduleForDirection, setSelectedScheduleForDirection] = useState<ScheduleItem | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // States cho CRUD lịch học thủ công / thực hành đột xuất
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formCourse, setFormCourse] = useState("");
  const [formType, setFormType] = useState<"dot_xuat" | "hoc_bu" | "kiem_tra" | "khac">("dot_xuat");
  const [formDayNum, setFormDayNum] = useState<number>(todayDayNum);
  const [formTime, setFormTime] = useState("Tiết 7-10");
  const [formRoom, setFormRoom] = useState("");
  const [formLecturer, setFormLecturer] = useState("");
  const [formNote, setFormNote] = useState("");
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);

  const resetForm = (targetDay?: number) => {
    setIsEditing(false);
    setEditingId(null);
    setFormCourse("");
    setFormType("dot_xuat");
    setFormDayNum(targetDay || selectedDay);
    setFormTime("Tiết 7-10");
    setFormRoom("");
    setFormLecturer("");
    setFormNote("");
    setDayDropdownOpen(false);
    setPeriodDropdownOpen(false);
    setIsCustomTime(false);
  };

  const handleOpenAddModal = (targetDay?: number) => {
    resetForm(targetDay);
    setModalVisible(true);
  };

  const handleOpenEditModal = (item: ScheduleItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormCourse(item.course);
    setFormType((item.type as any) || "dot_xuat");
    setFormDayNum(item.dayNum);
    setFormTime(item.time || "Tiết 7-10");
    setFormRoom(item.room);
    setFormLecturer(item.lecturer || "");
    setFormNote(item.note || "");
    setDayDropdownOpen(false);
    setPeriodDropdownOpen(false);
    const matchedPreset = PERIOD_OPTIONS.some((p) => p.label === item.time);
    setIsCustomTime(!matchedPreset && !!item.time);
    setModalVisible(true);
  };

  const handleSaveSchedule = async () => {
    if (!formCourse.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên môn học hoặc ca thực hành.");
      return;
    }
    if (!formRoom.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập phòng học.");
      return;
    }

    const dayObj = DAYS.find((d) => d.num === formDayNum) || DAYS[0];
    const thuStr = dayObj.label;

    setSubmitting(true);
    try {
      const payload = {
        ten_hp: formCourse.trim(),
        thu: thuStr,
        tiet: formTime.trim(),
        phong: formRoom.trim(),
        giang_vien: formLecturer.trim(),
        ghi_chu: formNote.trim(),
        loai_lich: formType,
      };

      if (isEditing && editingId !== null) {
        await apiUpdateCustomSchedule(editingId, payload);
        const updatedList = scheduleList.map((item) => {
          if (item.id === editingId) {
            return {
              ...item,
              course: formCourse.trim(),
              code: thuStr,
              day: thuStr,
              dayNum: formDayNum,
              time: formTime.trim().startsWith("Tiết") ? formTime.trim() : (formTime.includes(":") ? formTime.trim() : `Tiết ${formTime.trim()}`),
              room: formRoom.trim(),
              lecturer: formLecturer.trim() || "Chưa có GV",
              note: formNote.trim(),
              type: formType,
              direction: parseRoomDirections(formRoom.trim()),
            };
          }
          return item;
        });
        setScheduleList(updatedList);
        setSelectedDay(formDayNum);
        Alert.alert("Thành công", "Đã cập nhật lịch học.");
      } else {
        const res = await apiCreateCustomSchedule(payload);
        const newId = res?.data?.id || `custom-${Date.now()}`;
        const newItem: ScheduleItem = {
          id: newId,
          course: formCourse.trim(),
          code: thuStr,
          day: thuStr,
          dayNum: formDayNum,
          time: formTime.trim().startsWith("Tiết") ? formTime.trim() : (formTime.includes(":") ? formTime.trim() : `Tiết ${formTime.trim()}`),
          room: formRoom.trim(),
          lecturer: formLecturer.trim() || "Chưa có GV",
          isCustom: true,
          note: formNote.trim(),
          type: formType,
          direction: parseRoomDirections(formRoom.trim()),
        };
        const newList = [...scheduleList, newItem];
        setScheduleList(newList);
        setSelectedDay(formDayNum);
        Alert.alert("Thành công", `Đã thêm lịch vào ${thuStr}.`);
      }

      setModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể lưu lịch: " + (err?.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = (item: ScheduleItem) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa lịch "${item.course}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteCustomSchedule(item.id);
              const newList = scheduleList.filter((s) => s.id !== item.id);
              setScheduleList(newList);
              Alert.alert("Đã xóa", "Lịch học đã được xóa thành công.");
            } catch (err: any) {
              Alert.alert("Lỗi", "Không thể xóa lịch: " + (err?.message || ""));
            }
          },
        },
      ]
    );
  };

  const fetchSchedule = async (forceReload = false, weekOpts?: { week?: string; weekOffset?: number; weekIndex?: number }) => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      let mssv = "";
      let name = "";
      if (userStr) {
        const u = JSON.parse(userStr);
        mssv = u.mssv || u.masv || "";
        name = u.ho_ten || u.fullName || "";
        setStudentInfo({ mssv, name });
      }

      const isRealAccount = mssv && mssv !== "guest";
      const cacheKey = `@offline_schedule_${isRealAccount ? mssv : 'current'}`;
      if (!forceReload && !weekOpts) {
        const cached = await readLocalCache<any>(cacheKey);
        if (cached && cached.data) {
          if (cached.data.weekRange) setWeekRangeText(cached.data.weekRange);
          if (cached.data.availableWeeks && Array.isArray(cached.data.availableWeeks)) {
            setAvailableWeeks(cached.data.availableWeeks);
          }
          if (cached.data.selectedWeekIndex !== undefined) setSelectedWeekIndex(cached.data.selectedWeekIndex);
          if (cached.data.currentWeekIndex !== undefined) setCurrentWeekIndex(cached.data.currentWeekIndex);
          if (cached.data.nextWeekIndex !== undefined) setNextWeekIndex(cached.data.nextWeekIndex);
          if (cached.data.isSunday !== undefined) setIsSunday(cached.data.isSunday);
          if (cached.data.schedules && cached.data.schedules.length > 0) {
            setScheduleList(cached.data.schedules);
            setLoading(false);
          }
        }
      }

      const res = await apiGetSchedule(isRealAccount ? mssv : undefined, forceReload, weekOpts);

      if (res && res.isOfflineCache) {
        setIsOfflineData(true);
        setCachedAt(res.cachedAt || null);
      } else {
        setIsOfflineData(false);
      }

      if (res && res.success) {
        if (res.weekRange) {
          setWeekRangeText(res.weekRange);
        }
        if (res.isSunday !== undefined) setIsSunday(res.isSunday);
        if (res.currentWeekIndex !== undefined) setCurrentWeekIndex(res.currentWeekIndex);
        if (res.nextWeekIndex !== undefined) setNextWeekIndex(res.nextWeekIndex);
        if (res.selectedWeekIndex !== undefined) {
          setSelectedWeekIndex(res.selectedWeekIndex);
          // Nếu vào Chủ nhật và đang hiển thị Tuần sau, chuyển sang Thứ 2 nếu CN không có tiết
          if (res.isSunday && res.selectedWeekIndex === res.nextWeekIndex && selectedDay === 1) {
            const scheds = res.schedules || [];
            const hasSundayClass = scheds.some((s: any) => s.dayNum === 1);
            if (!hasSundayClass) {
              setSelectedDay(2);
            }
          }
        }
        if (res.availableWeeks && Array.isArray(res.availableWeeks)) {
          setAvailableWeeks(res.availableWeeks);
        }

        if (res.schedules && Array.isArray(res.schedules) && res.schedules.length > 0) {
          setScheduleList(res.schedules);
        }
      }
    } catch (error) {
      console.warn("Lỗi tải thời khóa biểu:", error);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectWeek = (w: AvailableWeekItem) => {
    setSelectedWeekIndex(w.index);
    setWeekRangeText(w.weekRange);
    if (w.schedules && Array.isArray(w.schedules) && w.schedules.length > 0) {
      setScheduleList(w.schedules);
      // Nếu chọn tuần sau vào Chủ nhật, ưu tiên chọn Thứ 2 nếu CN không có môn
      if (isSunday && w.isNext && selectedDay === 1) {
        const hasSundayClass = w.schedules.some((s) => s.dayNum === 1);
        if (!hasSundayClass) {
          setSelectedDay(2);
        }
      }
    } else {
      setLoading(true);
      fetchSchedule(false, { weekIndex: w.index });
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule(true, { weekIndex: selectedWeekIndex });
  };

  const filtered = scheduleList.filter((item) => item.dayNum === selectedDay);

  const subtitle =
    studentInfo.mssv && studentInfo.mssv !== "guest"
      ? `${weekRangeText}`
      : weekRangeText;

  const currentDirection = selectedScheduleForDirection
    ? ((selectedScheduleForDirection as any).direction || parseRoomDirections(selectedScheduleForDirection.room))
    : null;

  const handleOpenCampusMap = () => {
    const room = selectedScheduleForDirection?.room || "";
    const subject = selectedScheduleForDirection?.course || "";
    const building = currentDirection?.building || "";
    const buildingCode = currentDirection?.buildingCode || "";
    setSelectedScheduleForDirection(null);
    router.push({
      pathname: "/(main)/map",
      params: {
        room,
        subject,
        building,
        buildingCode,
        t: Date.now().toString(),
      },
    });
  };

  const handleOpenGoogleMaps = (building: string) => {
    const query = encodeURIComponent(`Trường Đại học ${building}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch((err) => {
      console.warn("Không thể mở Google Maps:", err);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Thời khóa biểu"
        subtitle={subtitle}
        rightElement={
          <TouchableOpacity
            onPress={() => handleOpenAddModal(selectedDay)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.35)",
            }}
          >
            <Feather name="plus-circle" size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Thêm lịch</Text>
          </TouchableOpacity>
        }
      />

      {/* 1. THANH CHỌN TUẦN HỌC (Tuần này / Tuần sau / ...) */}
      {availableWeeks && availableWeeks.length > 0 && (
        <View style={{ backgroundColor: "#F8FAFC", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#E2E8F0" }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginRight: 2 }}>
              <Feather name="calendar" size={13} color={AppColors.primary} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary }}>Tuần học:</Text>
            </View>

            {availableWeeks.map((w) => {
              const isSelectedWeek = w.index === selectedWeekIndex;
              const matchDates = w.weekRange.match(/(\d{2}\/\d{2})\/\d{4}.*?(\d{2}\/\d{2})\/\d{4}/);
              const shortDates = matchDates ? `${matchDates[1]} - ${matchDates[2]}` : "";
              const displayLabel = w.label ? `${w.label}${shortDates ? ` (${shortDates})` : ""}` : (shortDates || `Tuần ${w.index + 1}`);

              return (
                <TouchableOpacity
                  key={w.index}
                  onPress={() => handleSelectWeek(w)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    backgroundColor: isSelectedWeek ? AppColors.primary : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: isSelectedWeek ? AppColors.primary : "#CBD5E1",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isSelectedWeek ? 0.15 : 0.04,
                    shadowRadius: 2,
                    elevation: isSelectedWeek ? 2 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelectedWeek ? "700" : "600",
                      color: isSelectedWeek ? "#FFFFFF" : AppColors.text,
                    }}
                  >
                    {displayLabel}
                  </Text>
                  {w.isNext && isSunday && (
                    <View
                      style={{
                        backgroundColor: isSelectedWeek ? "rgba(255,255,255,0.25)" : "#FEF3C7",
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "700", color: isSelectedWeek ? "#FFFFFF" : "#D97706" }}>
                        Tuần tới
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 2. THÔNG BÁO THÔNG MINH KHI ĐANG LÀ CHỦ NHẬT */}
      {isSunday && selectedWeekIndex === nextWeekIndex && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#EFF6FF",
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderColor: "#BFDBFE",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <Feather name="info" size={14} color="#2563EB" />
            <Text style={{ fontSize: 12, color: "#1D4ED8", fontWeight: "600", flex: 1 }}>
              Hôm nay là Chủ nhật: Đang xem trước lịch học Tuần sau
            </Text>
          </View>
          {availableWeeks[currentWeekIndex] && (
            <TouchableOpacity
              onPress={() => handleSelectWeek(availableWeeks[currentWeekIndex])}
              style={{
                backgroundColor: "#DBEAFE",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E40AF" }}>Xem tuần này</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ paddingVertical: 12, backgroundColor: AppColors.cardBg, borderBottomWidth: 1, borderColor: AppColors.cardBorder }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {DAYS.map((d) => {
            const isSelected = d.num === selectedDay;
            const isToday = d.num === todayDayNum;
            return (
              <TouchableOpacity
                key={d.num}
                onPress={() => setSelectedDay(d.num)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? AppColors.primary
                    : isToday
                    ? "#EFF6FF"
                    : AppColors.muted,
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                  borderColor: isToday && !isSelected ? AppColors.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isSelected
                      ? "#FFFFFF"
                      : isToday
                      ? AppColors.primary
                      : AppColors.textSecondary,
                  }}
                >
                  {d.label}{isToday ? "" : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isOfflineData && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FEF3C7",
              borderWidth: 1,
              borderColor: "#FDE68A",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <Feather name="wifi-off" size={15} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "600", flex: 1 }}>
              Đang xem lịch học lưu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""} • Vuốt xuống để cập nhật lại
            </Text>
          </View>
        )}

        {loading || refreshing ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: AppColors.cardBg,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <SkeletonBox width={90} height={22} borderRadius={6} backgroundColor="#CBD5E1" />
                  <SkeletonBox width={65} height={22} borderRadius={6} />
                </View>
                <SkeletonBox width="85%" height={18} borderRadius={4} style={{ marginBottom: 10 }} />
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <SkeletonBox width={80} height={16} borderRadius={4} />
                  <SkeletonBox width={120} height={16} borderRadius={4} />
                </View>
                <SkeletonBox width={140} height={14} borderRadius={4} style={{ marginBottom: 14 }} />
                <View style={{ borderTopWidth: 1, borderTopColor: "#EEF2F6", paddingTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
                  <SkeletonBox width={110} height={30} borderRadius={6} />
                  <SkeletonBox width={90} height={30} borderRadius={6} />
                </View>
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: "center" }}>
            <Feather name="calendar" size={48} color={AppColors.cardBorder} />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: AppColors.text }}>Không có tiết học</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: AppColors.textMuted }}>Bạn được nghỉ trong ngày này!</Text>
            <TouchableOpacity
              onPress={() => handleOpenAddModal(selectedDay)}
              activeOpacity={0.8}
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: AppColors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Feather name="plus-circle" size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                Thêm lịch cho {DAYS.find((d) => d.num === selectedDay)?.label || "hôm nay"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((item) => (
              <View
                key={item.id}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: AppColors.cardBg,
                  borderWidth: 1,
                  borderColor: item.isCustom ? "#FDE68A" : AppColors.cardBorder,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                {/* Header row: Code & Time & Custom badge */}
                <View style={[s.row, s.between, { marginBottom: 8, alignItems: "center" }]}>
                  <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: item.isCustom
                          ? item.type === "hoc_bu"
                            ? "#EFF6FF"
                            : item.type === "kiem_tra"
                            ? "#FEE2E2"
                            : item.type === "khac"
                            ? "#D1FAE5"
                            : "#FEF3C7"
                          : "#EEF2FF",
                      }}
                    >
                      {item.isCustom ? (
                        <>
                          <Feather
                            name={
                              item.type === "hoc_bu"
                                ? "zap"
                                : item.type === "kiem_tra"
                                ? "file-text"
                                : item.type === "khac"
                                ? "bookmark"
                                : "activity"
                            }
                            size={12}
                            color={
                              item.type === "hoc_bu"
                                ? "#2563EB"
                                : item.type === "kiem_tra"
                                ? "#DC2626"
                                : item.type === "khac"
                                ? "#059669"
                                : "#D97706"
                            }
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color:
                                item.type === "hoc_bu"
                                  ? "#2563EB"
                                  : item.type === "kiem_tra"
                                  ? "#DC2626"
                                  : item.type === "khac"
                                  ? "#059669"
                                  : "#D97706",
                            }}
                          >
                            {item.type === "hoc_bu"
                              ? "Học bù"
                              : item.type === "kiem_tra"
                              ? "Kiểm tra"
                              : item.type === "khac"
                              ? "Lịch tự tạo"
                              : "Thực hành"}
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: AppColors.primary,
                          }}
                        >
                          {item.code}
                        </Text>
                      )}
                    </View>
                    {item.isCustom && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#F1F5F9" }}>
                        <Text style={{ fontSize: 10, color: "#64748B", fontWeight: "600" }}>Tự thêm</Text>
                      </View>
                    )}
                  </View>
                  <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                    <Feather name="clock" size={13} color={AppColors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textSecondary }}>{item.time}</Text>
                  </View>
                </View>

                {/* Course Title */}
                <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text, marginBottom: 6 }}>
                  {item.course}
                </Text>

                {/* Ghi chú nếu có */}
                {item.note ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, backgroundColor: "#F8FAFC", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}>
                    <Feather name="info" size={12} color="#64748B" />
                    <Text style={{ fontSize: 12, color: "#475569", flex: 1 }} numberOfLines={2}>
                      {item.note}
                    </Text>
                  </View>
                ) : null}

                {/* Bottom Row: Room & Lecturer info + Action buttons */}
                <View
                  style={[
                    s.row,
                    s.between,
                    {
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderColor: AppColors.cardBorder,
                      alignItems: "center",
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 4, marginRight: 8 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedScheduleForDirection(item)}
                      activeOpacity={0.7}
                      style={[s.row, { gap: 6, alignItems: "center" }]}
                    >
                      <Feather name="map-pin" size={14} color={AppColors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>
                        {item.room}
                      </Text>
                      <Feather name="info" size={12} color={AppColors.primaryLight} />
                    </TouchableOpacity>

                    <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                      <Feather name="user" size={12} color={AppColors.textMuted} />
                      <Text style={{ fontSize: 12, color: AppColors.textMuted }} numberOfLines={1}>
                        {item.lecturer}
                      </Text>
                    </View>
                  </View>

                  {/* Nhóm nút hành động */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {item.isCustom && (
                      <>
                        {/* Nút sửa */}
                        <TouchableOpacity
                          onPress={() => handleOpenEditModal(item)}
                          activeOpacity={0.7}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: "#F1F5F9",
                            borderWidth: 1,
                            borderColor: "#E2E8F0",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather name="edit-2" size={14} color="#475569" />
                        </TouchableOpacity>

                        {/* Nút xóa */}
                        <TouchableOpacity
                          onPress={() => handleDeleteSchedule(item)}
                          activeOpacity={0.7}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: "#FEE2E2",
                            borderWidth: 1,
                            borderColor: "#FECACA",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather name="trash-2" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    )}

                    {/* Nút chỉ đường */}
                    <TouchableOpacity
                      onPress={() => setSelectedScheduleForDirection(item)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: "#EEF2FF",
                        borderWidth: 1,
                        borderColor: "#C7D2FE",
                      }}
                    >
                      <Feather name="navigation" size={13} color={AppColors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.primary }}>
                        Chỉ đường
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL THÊM / CHỈNH SỬA LỊCH HỌC THỦ CÔNG */}
      <Modal
        visible={modalVisible}
        transparent={true}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => {
          if (!submitting) setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (!submitting) setModalVisible(false);
            }}
            style={{ flex: 1 }}
          />

          <View
            style={{
              backgroundColor: AppColors.cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: 24,
              maxHeight: "90%",
            }}
          >
            {/* Header Modal */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderColor: AppColors.cardBorder,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={isEditing ? "edit" : "plus-circle"} size={18} color="#D97706" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text }}>
                    {isEditing ? "Chỉnh sửa lịch học" : "Thêm lịch học / Thực hành"}
                  </Text>
                  <Text style={{ fontSize: 12, color: AppColors.textMuted }}>
                    {isEditing ? "Cập nhật thông tin ca học" : "Lịch thực hành đột xuất, học bù, kiểm tra"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={submitting}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: AppColors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="x" size={16} color={AppColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 14 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Tên môn học */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
                  Tên môn học<Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <TextInput
                  value={formCourse}
                  onChangeText={setFormCourse}
                  placeholder=""
                  placeholderTextColor={AppColors.textMuted}
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AppColors.text,
                  }}
                />
              </View>

              {/* Loại lịch - Hiển thị dạng lưới thẻ 2x2 trực quan */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 8 }}>
                  Phân loại lịch
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }}>
                  {[
                    { key: "dot_xuat", label: "Thực hành", icon: "activity", color: "#D97706", bg: "#FEF3C7", lightBg: "#FFFBEB" },
                    { key: "hoc_bu", label: "Học bù", icon: "zap", color: "#2563EB", bg: "#EFF6FF", lightBg: "#EFF6FF" },
                    { key: "kiem_tra", label: "Kiểm tra / Thi", icon: "file-text", color: "#DC2626", bg: "#FEE2E2", lightBg: "#FEF2F2" },
                    { key: "khac", label: "Khác", icon: "bookmark", color: "#059669", bg: "#D1FAE5", lightBg: "#F0FDF4" },
                  ].map((t) => {
                    const isSel = formType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        onPress={() => setFormType(t.key as any)}
                        activeOpacity={0.7}
                        style={{
                          width: "48.5%",
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 10,
                          paddingHorizontal: 10,
                          borderRadius: 14,
                          backgroundColor: isSel ? t.lightBg : "#F8FAFC",
                          borderWidth: isSel ? 1.5 : 1,
                          borderColor: isSel ? t.color : "#E2E8F0",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: isSel ? t.bg : "#EDF2F7",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather name={t.icon as any} size={15} color={isSel ? t.color : "#64748B"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSel ? "700" : "600",
                              color: isSel ? t.color : AppColors.text,
                            }}
                            numberOfLines={1}
                          >
                            {t.label}
                          </Text>
                        </View>
                        {isSel && (
                          <Feather name="check" size={14} color={t.color} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Thứ và Tiết - 2 cột cạnh nhau có ô chọn dropdown đè lên thay vì đẩy xuống */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "flex-start",
                  position: "relative",
                  zIndex: (dayDropdownOpen || periodDropdownOpen) ? 1000 : 1,
                  elevation: (dayDropdownOpen || periodDropdownOpen) ? 20 : 1,
                }}
              >
                {/* Cột 1: Thứ */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
                    Thứ <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View style={{ position: "relative", zIndex: dayDropdownOpen ? 1001 : 1 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setDayDropdownOpen(!dayDropdownOpen);
                        setPeriodDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderWidth: 1,
                        borderColor: dayDropdownOpen ? AppColors.primary : AppColors.cardBorder,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                        <Feather name="calendar" size={14} color={AppColors.primary} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: AppColors.text,
                          }}
                          numberOfLines={1}
                        >
                          {(() => {
                            const d = DAYS.find((item) => item.num === formDayNum);
                            return d ? (d.num === 1 ? "Chủ nhật" : d.label) : "Thứ 2";
                          })()}
                        </Text>
                      </View>
                      <Feather
                        name={dayDropdownOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={AppColors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Dropdown danh sách Thứ - Đè lên nội dung bên dưới */}
                    {dayDropdownOpen && (
                      <View
                        style={{
                          position: "absolute",
                          top: "100%",
                          marginTop: 4,
                          left: 0,
                          right: 0,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: AppColors.cardBorder,
                          maxHeight: 240,
                          overflow: "hidden",
                          elevation: 25,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.18,
                          shadowRadius: 10,
                          zIndex: 9999,
                        }}
                      >
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {DAYS.map((d) => {
                            const isSel = formDayNum === d.num;
                            const label = d.num === 1 ? "Chủ nhật" : d.label;
                            return (
                              <TouchableOpacity
                                key={d.num}
                                onPress={() => {
                                  setFormDayNum(d.num);
                                  setDayDropdownOpen(false);
                                }}
                                activeOpacity={0.7}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  paddingHorizontal: 12,
                                  paddingVertical: 9,
                                  backgroundColor: isSel ? "#EEF2FF" : "#FFFFFF",
                                  borderBottomWidth: 1,
                                  borderBottomColor: "#F1F5F9",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: isSel ? "700" : "500",
                                    color: isSel ? AppColors.primary : AppColors.text,
                                  }}
                                >
                                  {label}
                                </Text>
                                {isSel && <Feather name="check" size={14} color={AppColors.primary} />}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Cột 2: Tiết */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
                    Tiết học <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View style={{ position: "relative", zIndex: periodDropdownOpen ? 1001 : 1 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setPeriodDropdownOpen(!periodDropdownOpen);
                        setDayDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderWidth: 1,
                        borderColor: periodDropdownOpen ? AppColors.primary : AppColors.cardBorder,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                        <Feather name="clock" size={14} color={AppColors.primary} />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: formTime ? AppColors.text : AppColors.textMuted,
                          }}
                          numberOfLines={1}
                        >
                          {formTime || "Chọn tiết"}
                        </Text>
                      </View>
                      <Feather
                        name={periodDropdownOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={AppColors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Dropdown danh sách Tiết - Đè lên nội dung bên dưới */}
                    {periodDropdownOpen && (
                      <View
                        style={{
                          position: "absolute",
                          top: "100%",
                          marginTop: 4,
                          left: 0,
                          right: 0,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: AppColors.cardBorder,
                          maxHeight: 240,
                          overflow: "hidden",
                          elevation: 25,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.18,
                          shadowRadius: 10,
                          zIndex: 9999,
                        }}
                      >
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                          {PERIOD_OPTIONS.map((p) => {
                            const isSel = formTime === p.label;
                            return (
                              <TouchableOpacity
                                key={p.label}
                                onPress={() => {
                                  setFormTime(p.label);
                                  setIsCustomTime(false);
                                  setPeriodDropdownOpen(false);
                                }}
                                activeOpacity={0.7}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  backgroundColor: isSel ? "#EEF2FF" : "#FFFFFF",
                                  borderBottomWidth: 1,
                                  borderBottomColor: "#F1F5F9",
                                }}
                              >
                                <View>
                                  <Text
                                    style={{
                                      fontSize: 12.5,
                                      fontWeight: isSel ? "700" : "600",
                                      color: isSel ? AppColors.primary : AppColors.text,
                                    }}
                                  >
                                    {p.label}
                                  </Text>
                                  <Text style={{ fontSize: 10, color: AppColors.textMuted, marginTop: 1 }}>
                                    {p.desc}
                                  </Text>
                                </View>
                                {isSel && <Feather name="check" size={13} color={AppColors.primary} />}
                              </TouchableOpacity>
                            );
                          })}
                          <TouchableOpacity
                            onPress={() => {
                              setIsCustomTime(true);
                              setPeriodDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              backgroundColor: isCustomTime ? "#EEF2FF" : "#FAFAFA",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Feather name="edit-2" size={12} color={AppColors.primary} />
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: AppColors.primary,
                              }}
                            >
                              Tự nhập khác...
                            </Text>
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    )}

                    {/* Ô nhập custom tiết nếu chọn "Tự nhập khác..." */}
                    {isCustomTime && (
                      <TextInput
                        value={formTime}
                        onChangeText={setFormTime}
                        placeholder="Ví dụ: 13:50 - 15:30"
                        placeholderTextColor={AppColors.textMuted}
                        autoFocus
                        style={{
                          marginTop: 6,
                          backgroundColor: "#F8FAFC",
                          borderWidth: 1,
                          borderColor: AppColors.primary,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          fontSize: 12.5,
                          color: AppColors.text,
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>

              {/* Phòng học */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
                  Phòng <Text style={{ color: "#EF4444" }}>*</Text>
                </Text>
                <TextInput
                  value={formRoom}
                  onChangeText={setFormRoom}
                  placeholder="Phòng học"
                  placeholderTextColor={AppColors.textMuted}
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AppColors.text,
                    marginBottom: 8,
                  }}
                />
              </View>

              {/* Giảng viên */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
                  Giảng viên
                </Text>
                <TextInput
                  value={formLecturer}
                  onChangeText={setFormLecturer}
                  placeholder="Tên giảng viên"
                  placeholderTextColor={AppColors.textMuted}
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AppColors.text,
                  }}
                />
              </View>

              {/* Ghi chú */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
                  Ghi chú cho ca học
                </Text>
                <TextInput
                  value={formNote}
                  onChangeText={setFormNote}
                  placeholder=""
                  placeholderTextColor={AppColors.textMuted}
                  multiline
                  numberOfLines={2}
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: AppColors.text,
                    minHeight: 50,
                  }}
                />
              </View>

              {/* Buttons */}
              <View style={{ marginTop: 8, gap: 10 }}>
                <TouchableOpacity
                  onPress={handleSaveSchedule}
                  disabled={submitting}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: AppColors.primary,
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                        {isEditing ? "Cập nhật lịch học" : "Lưu vào thời khóa biểu"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 11,
                    borderRadius: 14,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: AppColors.textSecondary }}>
                    Hủy bỏ
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL CHỈ ĐƯỜNG TỚI PHÒNG HỌC */}
      <Modal
        visible={!!selectedScheduleForDirection}
        transparent={true}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setSelectedScheduleForDirection(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedScheduleForDirection(null)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: AppColors.cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: 28,
              maxHeight: "88%",
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderColor: AppColors.cardBorder,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "#EEF2FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="navigation" size={18} color={AppColors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text }}>
                    Chỉ đường phòng học
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedScheduleForDirection(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: AppColors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="x" size={18} color={AppColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedScheduleForDirection && currentDirection && (
                <View style={{ gap: 16 }}>
                  {/* Card thông tin môn học & phòng */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 6 }}>
                      {selectedScheduleForDirection.course}
                    </Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: AppColors.primary,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>
                          {currentDirection.room}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: "#EEF2FF",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: AppColors.primary }}>
                          {currentDirection.floor}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: AppColors.muted,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: AppColors.textSecondary }}>
                          {currentDirection.buildingCode}
                        </Text>
                      </View>
                    </View>

                    <View style={{ gap: 4 }}>
                      <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                        <Feather name="clock" size={12} color={AppColors.textMuted} />
                        <Text style={{ fontSize: 12, color: AppColors.textSecondary }}>
                          {selectedScheduleForDirection.time}
                        </Text>
                      </View>
                      <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                        <Feather name="user" size={12} color={AppColors.textMuted} />
                        <Text style={{ fontSize: 12, color: AppColors.textSecondary }}>
                          {selectedScheduleForDirection.lecturer}
                        </Text>
                      </View>
                      <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                        <Feather name="map" size={12} color={AppColors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.primary }}>
                          {currentDirection.building}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Lộ trình từng bước */}
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 12 }}>
                      Lộ trình di chuyển chi tiết
                    </Text>

                    <View style={{ gap: 14 }}>
                      {currentDirection.steps.map((step: any, idx: number) => (
                        <View key={step.step} style={{ flexDirection: "row", gap: 12 }}>
                          {/* Timeline icon & vertical connector line */}
                          <View style={{ alignItems: "center" }}>
                            <View
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                backgroundColor: idx === 0 ? AppColors.primary : "#EEF2FF",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 1,
                                borderColor: idx === 0 ? AppColors.primary : "#C7D2FE",
                              }}
                            >
                              <Feather
                                name={step.icon}
                                size={14}
                                color={idx === 0 ? "#FFFFFF" : AppColors.primary}
                              />
                            </View>
                            {idx < currentDirection.steps.length - 1 && (
                              <View
                                style={{
                                  width: 2,
                                  height: 38,
                                  backgroundColor: "#E2E8F0",
                                  marginTop: 4,
                                }}
                              />
                            )}
                          </View>

                          {/* Content */}
                          <View style={{ flex: 1, paddingTop: 3 }}>
                            <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>
                              {step.step}. {step.title}
                            </Text>
                            <Text style={{ fontSize: 12, color: AppColors.textSecondary, marginTop: 2, lineHeight: 17 }}>
                              {step.desc}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Lưu ý & tiện ích gần phòng */}
                  <View
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: "#F0FDF4",
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                      gap: 6,
                    }}
                  >
                    <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                      <Feather name="check-circle" size={14} color="#16A34A" />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#16A34A" }}>
                        Tiện ích & Lưu ý
                      </Text>
                    </View>
                    {currentDirection.tips.map((tip: string, idx: number) => (
                      <View key={idx} style={[s.row, { gap: 6, alignItems: "flex-start" }]}>
                        <Text style={{ color: "#16A34A", fontSize: 12, lineHeight: 17 }}>•</Text>
                        <Text style={{ flex: 1, fontSize: 12, color: "#15803D", lineHeight: 17 }}>
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Nút hành động */}
                  <View style={{ gap: 10, marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenCampusMap()}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 13,
                        borderRadius: 14,
                        backgroundColor: AppColors.primary,
                      }}
                    >
                      <Feather name="map" size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
                        Xem trên Bản đồ trường
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenGoogleMaps(currentDirection.building)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: AppColors.primary,
                      }}
                    >
                      <Feather name="external-link" size={15} color={AppColors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.primary }}>
                        Mở vị trí ngoài Google Maps
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedScheduleForDirection(null)}
                      activeOpacity={0.7}
                      style={{
                        paddingVertical: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: AppColors.textSecondary }}>
                        Đóng lại
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}