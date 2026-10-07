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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetSchedule, readLocalCache } from "../../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTabBarScrollHandler } from "../../../src/components/MainTabs";

interface ScheduleItem {
  id: string | number;
  course: string;
  code: string;
  room: string;
  time: string;
  day: string;
  dayNum: number;
  lecturer: string;
}

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
  const [selectedScheduleForDirection, setSelectedScheduleForDirection] = useState<ScheduleItem | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const fetchSchedule = async () => {
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
      const cached = await readLocalCache<any>(cacheKey);
      if (cached && cached.data) {
        if (cached.data.weekRange) setWeekRangeText(cached.data.weekRange);
        if (cached.data.schedules && cached.data.schedules.length > 0) {
          setScheduleList(cached.data.schedules);
          setLoading(false);
        }
      }

      const res = await apiGetSchedule(isRealAccount ? mssv : undefined);

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

        if (res.schedules && Array.isArray(res.schedules) && res.schedules.length > 0) {
          setScheduleList(res.schedules);
        } else if (res.tables && res.tables.length > 0) {
          const rows = res.tables[0].rows || [];
          if (rows.length > 1) {
            const parsed: ScheduleItem[] = [];
            rows.slice(1).forEach((r: string[], idx: number) => {
              if (r.length >= 5) {
                const dayStr = r[0] || "";
                let dayNum = 2;

                const lowerDay = dayStr.toLowerCase();
                if (lowerDay.startsWith("thứ 3") || lowerDay.includes("thứ ba")) dayNum = 3;
                else if (lowerDay.startsWith("thứ 4") || lowerDay.includes("thứ tư")) dayNum = 4;
                else if (lowerDay.startsWith("thứ 5") || lowerDay.includes("thứ năm")) dayNum = 5;
                else if (lowerDay.startsWith("thứ 6") || lowerDay.includes("thứ sáu")) dayNum = 6;
                else if (lowerDay.startsWith("thứ 7") || lowerDay.includes("thứ bảy")) dayNum = 7;
                else if (lowerDay.includes("cn") || lowerDay.includes("chủ nhật")) dayNum = 1;
                else if (lowerDay.startsWith("thứ 2") || lowerDay.includes("thứ hai")) dayNum = 2;

                parsed.push({
                  id: `sc-${idx}`,
                  course: r[1] || "Môn học",
                  code: dayStr,
                  time: r[2] ? `Tiết ${r[2]}` : "Ca học tiêu chuẩn",
                  room: r[3] || "Khu giảng đường",
                  day: dayStr,
                  dayNum,
                  lecturer: r[4] || "Giảng viên bộ môn",
                });
              }
            });

            if (parsed.length > 0) {
              setScheduleList(parsed);
            }
          }
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

  useEffect(() => {
    fetchSchedule();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
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
    setSelectedScheduleForDirection(null);
    router.push({
      pathname: "/(main)/map",
      params: { room, subject },
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
      />

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

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={{ marginTop: 12, color: AppColors.textMuted, fontSize: 13 }}>Đang đồng bộ lịch học...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: "center" }}>
            <Feather name="calendar" size={48} color={AppColors.cardBorder} />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: AppColors.text }}>Không có tiết học</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: AppColors.textMuted }}>Bạn được nghỉ trong ngày này!</Text>
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
                  borderColor: AppColors.cardBorder,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                {/* Header row: Code & Time */}
                <View style={[s.row, s.between, { marginBottom: 8 }]}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#EEF2FF" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: AppColors.primary }}>{item.code}</Text>
                  </View>
                  <View style={[s.row, { gap: 6 }]}>
                    <Feather name="clock" size={13} color={AppColors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textSecondary }}>{item.time}</Text>
                  </View>
                </View>

                {/* Course Title */}
                <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text, marginBottom: 10 }}>
                  {item.course}
                </Text>

                {/* Bottom Row: Room & Lecturer info + Chỉ đường button */}
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
            ))}
          </View>
        )}
      </ScrollView>

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