import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetSchedule } from "../../../src/services/api";

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

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { id: '1', course: "Cấu trúc dữ liệu & Giải thuật", code: "CS301", room: "ENG-B204", time: "08:00 – 09:30", day: "Thứ 2", dayNum: 2, lecturer: "ThS. Nguyễn Văn A" },
  { id: '2', course: "Lập trình thiết bị di động", code: "NT118", room: "LAB-03", time: "09:45 – 11:15", day: "Thứ 2", dayNum: 2, lecturer: "TS. Trần Thị B" },
  { id: '3', course: "Hệ cơ sở dữ liệu", code: "IT202", room: "ENG-A102", time: "13:30 – 15:00", day: "Thứ 3", dayNum: 3, lecturer: "ThS. Lê Hoàng C" },
  { id: '4', course: "Mạng máy tính & Truyền thông", code: "NT101", room: "NET-LAB", time: "08:00 – 10:15", day: "Thứ 4", dayNum: 4, lecturer: "TS. Phạm Văn D" },
  { id: '5', course: "An toàn thông tin mạng", code: "NT205", room: "ENG-B301", time: "10:30 – 12:00", day: "Thứ 5", dayNum: 5, lecturer: "ThS. Vũ Thị E" },
  { id: '6', course: "Đồ án chuyên ngành", code: "NT300", room: "ENG-B101", time: "08:00 – 11:30", day: "Thứ 6", dayNum: 6, lecturer: "Hội đồng bộ môn" },
];

const DAYS = [
  { label: "Thứ 2", num: 2 },
  { label: "Thứ 3", num: 3 },
  { label: "Thứ 4", num: 4 },
  { label: "Thứ 5", num: 5 },
  { label: "Thứ 6", num: 6 },
  { label: "Thứ 7", num: 7 },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(2);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(FALLBACK_SCHEDULE);

  const fetchSchedule = async () => {
    try {
      const res = await apiGetSchedule();
      if (res && res.success && res.tables && res.tables.length > 0) {
        const rows = res.tables[0].rows || [];
        if (rows.length > 1) {
          const parsed: ScheduleItem[] = [];
          rows.slice(1).forEach((r: string[], idx: number) => {
            if (r.length >= 4) {
              const dayStr = r[1] || "";
              let dayNum = 2;
              if (dayStr.includes("3") || dayStr.toLowerCase().includes("ba")) dayNum = 3;
              else if (dayStr.includes("4") || dayStr.toLowerCase().includes("tư")) dayNum = 4;
              else if (dayStr.includes("5") || dayStr.toLowerCase().includes("năm")) dayNum = 5;
              else if (dayStr.includes("6") || dayStr.toLowerCase().includes("sáu")) dayNum = 6;
              else if (dayStr.includes("7") || dayStr.toLowerCase().includes("bảy")) dayNum = 7;

              parsed.push({
                id: `sc-${idx}`,
                course: r[2] || "Môn học",
                code: r[0] || `HP-${idx + 1}`,
                time: r[3] ? `Tiết ${r[3]}` : "Ca học tiêu chuẩn",
                room: r[5] || r[4] || "Khu giảng đường",
                day: `Thứ ${dayNum}`,
                dayNum,
                lecturer: r[6] || "Giảng viên bộ môn",
              });
            }
          });
          if (parsed.length > 0) {
            setScheduleList(parsed);
          }
        }
      }
    } catch {
      // Keep fallbacks
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top', 'left', 'right']}>
      <NavHeader
        title="Lịch học & Lịch thi"
        subtitle="Học kỳ 1 • Năm học 2025 - 2026"
        showBack={true}
        onBack={() => router.push("/(main)/home")}
      />

      {/* Days selector */}
      <View style={{ paddingVertical: 12, backgroundColor: AppColors.cardBg, borderBottomWidth: 1, borderColor: AppColors.cardBorder }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {DAYS.map((d) => {
            const isSelected = d.num === selectedDay;
            return (
              <TouchableOpacity
                key={d.num}
                onPress={() => setSelectedDay(d.num)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: isSelected ? AppColors.primary : AppColors.muted,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: isSelected ? "#FFFFFF" : AppColors.textSecondary }}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
                <View style={[s.row, s.between, { marginBottom: 8 }]}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#EEF2FF" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: AppColors.primary }}>{item.code}</Text>
                  </View>
                  <View style={[s.row, { gap: 6 }]}>
                    <Feather name="clock" size={13} color={AppColors.textMuted} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textSecondary }}>{item.time}</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text, marginBottom: 8 }}>
                  {item.course}
                </Text>

                <View style={[s.row, s.between, { paddingTop: 8, borderTopWidth: 1, borderColor: AppColors.cardBorder }]}>
                  <View style={[s.row, { gap: 6 }]}>
                    <Feather name="map-pin" size={13} color={AppColors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: AppColors.textSecondary }}>{item.room}</Text>
                  </View>
                  <View style={[s.row, { gap: 6 }]}>
                    <Feather name="user" size={13} color={AppColors.textMuted} />
                    <Text style={{ fontSize: 12, color: AppColors.textMuted }}>{item.lecturer}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

