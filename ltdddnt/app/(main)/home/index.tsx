import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { apiGetSchedule, apiGetDashboard } from "../../../src/services/api";

interface StudentInfo {
  mssv?: string;
  ho_ten?: string;
  fullName?: string;
  email?: string;
  lop?: string;
  khoa?: string;
}

interface AlertItem {
  id: number | string;
  type: "info" | "warning" | "success";
  text: string;
  content?: string;
  sender?: string;
  time: string;
}

const DEFAULT_ALERTS: AlertItem[] = [
  { id: 1, type: "info", text: "Thư viện mở cửa phục vụ mùa thi từ 7h00 - 21h30.", content: "Thư viện mở cửa phục vụ mùa thi từ 7h00 - 21h30 tại tất cả các cơ sở.", sender: "Ban Quản lý Thư viện", time: "Hôm nay" },
  { id: 2, type: "warning", text: "Hạn đóng học phí học kỳ này trước ngày 15 hàng tháng.", content: "Đề nghị sinh viên hoàn thành học phí đúng thời hạn quy định.", sender: "Phòng Tài vụ", time: "Quan trọng" },
  { id: 3, type: "success", text: "Lịch thi học phần đã được cập nhật chính thức.", content: "Lịch thi kết thúc học phần đã được đăng tải trên cổng thông tin sinh viên.", sender: "Phòng Đào tạo", time: "1 giờ trước" },
];

const DEFAULT_STATS = [
  { label: "Ghế Thư viện", value: "34", sub: "Còn trống", icon: "book-open" as const, color: AppColors.success },
  { label: "Căng tin", value: "8 phút", sub: "Thời gian chờ", icon: "coffee" as const, color: AppColors.warning },
  { label: "Tiện ích số", value: "24/7", sub: "Hoạt động", icon: "wifi" as const, color: AppColors.info },
  { label: "Trạng thái", value: "Bình thường", sub: "Toàn khuôn viên", icon: "check-circle" as const, color: AppColors.purple },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : Math.max(insets.top + 12, 44);

  const [student, setStudent] = useState<StudentInfo>({ ho_ten: "Đang tải...", mssv: "" });
  const [nextClass, setNextClass] = useState<any>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>(DEFAULT_ALERTS);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      let currentUser: any = {};
      if (userStr) {
        currentUser = JSON.parse(userStr);
        setStudent({
          mssv: currentUser.mssv || "",
          ho_ten: currentUser.ho_ten || currentUser.fullName || currentUser.full_name || "Sinh viên",
          fullName: currentUser.fullName || currentUser.ho_ten || currentUser.full_name || "Sinh viên",
          email: currentUser.email,
          lop: currentUser.lop,
          khoa: currentUser.khoa,
        });
      }

      const mssv = currentUser.mssv || currentUser.masv;
      const isRealAccount = mssv && mssv !== "guest";

      // 1. Tải dữ liệu hợp nhất từ Backend Dashboard API
      const dashRes = await apiGetDashboard();
      if (dashRes && dashRes.success) {
        if (dashRes.student && isRealAccount) {
          setStudent((prev) => ({ ...prev, ...dashRes.student }));
        }
        if (dashRes.alerts && dashRes.alerts.length > 0) {
          setAlerts(dashRes.alerts);
        }
        if (dashRes.stats && Array.isArray(dashRes.stats)) {
          setStats(dashRes.stats);
        }
      }

      // 2. Tải lịch học kế tiếp trực tiếp từ Backend Schedule
      const scheduleRes = await apiGetSchedule(isRealAccount ? mssv : undefined);
      if (scheduleRes && scheduleRes.success) {
        if (scheduleRes.nextClass) {
          setNextClass(scheduleRes.nextClass);
        } else if (scheduleRes.tables && scheduleRes.tables.length > 0) {
          const rows = scheduleRes.tables[0]?.rows || [];
          if (rows.length > 1) {
            const firstRow = rows[1];
            setNextClass({
              subject: firstRow[2] || firstRow[1] || "Môn chuyên ngành",
              room: firstRow[5] || firstRow[4] || "Phòng B201",
              time: firstRow[3] ? `Tiết ${firstRow[3]}` : "Ca sáng 07:30",
              lecturer: firstRow[6] || "Giảng viên bộ môn",
            });
          }
        }
      }
    } catch {
      // Keep fallbacks
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const onNavigate = (screen: string) => {
    if (screen === "home") router.push("/(main)/home");
    else router.push(`/(main)/${screen}` as any);
  };

  const quickActions = [
    { icon: "navigation" as const, label: "Bản đồ", screen: "map", bg: AppColors.muted, fg: AppColors.accent },
    { icon: "calendar" as const, label: "Lịch học", screen: "schedule", bg: "#DBEAFE", fg: AppColors.primary },
    { icon: "message-square" as const, label: "Phản hồi", screen: "feedback", bg: "#FEF3C7", fg: "#D97706" },
    { icon: "bar-chart-2" as const, label: "Kết quả", screen: "grades", bg: "#D1FAE5", fg: "#059669" },
  ];

  const alertMeta = {
    info: { icon: "info" as const, color: AppColors.info, bg: "#EFF6FF", border: "#BFDBFE" },
    warning: { icon: "alert-triangle" as const, color: AppColors.warning, bg: "#FFFBEB", border: "#FDE68A" },
    success: { icon: "check" as const, color: AppColors.success, bg: "#ECFDF5", border: "#A7F3D0" },
  };


  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} translucent />
      {/* Nền xanh cố định cho vùng tai thỏ / Dynamic Island / Status Bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(insets.top, 50), backgroundColor: AppColors.primary, zIndex: 1 }} />

      <ScrollView
        style={{ flex: 1, zIndex: 2 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FFFFFF" 
            colors={[AppColors.primary]} 
            progressViewOffset={insets.top}
          />
        }
      >
        <LinearGradient
          colors={[AppColors.primary, AppColors.primary]}
          style={{ paddingHorizontal: 24, paddingTop: topPadding, paddingBottom: 32 }}
        >
        <View style={[s.row, s.between, { marginBottom: 16 }]}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {student.mssv && student.mssv !== "guest" ? `Sinh viên • ${student.mssv}` : "Khách tham quan"}
            </Text>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 2 }}>
              {student.ho_ten || student.fullName || "Sinh viên"} 
            </Text>
          </View>
          <View style={s.row}>
            <TouchableOpacity onPress={() => onNavigate("sos")} style={[s.iconBtn, { backgroundColor: AppColors.danger, marginRight: 8 }]}>
              <Feather name="shield" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigate("profile")} style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Feather name="user" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lớp học tiếp theo preview */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", padding: 18, borderRadius: 20 }}>
          <View style={[s.row, s.between, { marginBottom: 8 }]}>
            <View style={s.row}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.accent, marginRight: 8 }} />
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700" }}>LỚP HỌC KẾ TIẾP</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{nextClass?.time || "Hôm nay"}</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900", marginBottom: 6 }}>
            {nextClass?.subject || "Kiểm tra lịch học trong tuần"}
          </Text>
          <View style={[s.row, s.between]}>
            <View style={s.row}>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.7)" style={{ marginRight: 4 }} />
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" }}>
                {nextClass?.room || "Khu giảng đường"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate("schedule")}>
              <Text style={{ color: "#93C5FD", fontSize: 12, fontWeight: "700" }}>Chi tiết lịch →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={[s.sectionTitle, { fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 12 }]}>
          Tác vụ nhanh
        </Text>
        <View style={[s.row, s.between, { marginBottom: 20 }]}>
          {quickActions.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              onPress={() => onNavigate(qa.screen)}
              activeOpacity={0.7}
              style={{ alignItems: "center", width: "22%" }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: qa.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Feather name={qa.icon} size={22} color={qa.fg} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.text, textAlign: "center" }}>
                {qa.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Thông báo khuôn viên */}
        <View style={[s.row, s.between, { alignItems: "center", marginBottom: 10 }]}>
          <Text style={[s.sectionTitle, { fontSize: 15, fontWeight: "800", color: AppColors.text }]}>
            Thông báo & Cảnh báo
          </Text>
          <Text style={{ fontSize: 12, color: AppColors.primary, fontWeight: "700" }}>
            {alerts.length} tin mới
          </Text>
        </View>

        <View style={{ gap: 8, marginBottom: 20 }}>
          {alerts.map((alert) => {
            const meta = alertMeta[alert.type] || alertMeta.info;
            return (
              <TouchableOpacity
                key={alert.id}
                activeOpacity={0.7}
                onPress={() => {
                  Alert.alert(
                    alert.text,
                    `${alert.content || alert.text}\n\n📢 Người gửi: ${alert.sender || 'Ban Giám hiệu'}\n📅 Thời gian: ${alert.time}`,
                    [{ text: "Đã hiểu" }]
                  );
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: meta.bg,
                  borderWidth: 1,
                  borderColor: meta.border,
                }}
              >
                <Feather name={meta.icon} size={16} color={meta.color} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: AppColors.text, fontWeight: "600" }}>{alert.text}</Text>
                  <Text style={{ fontSize: 11, color: AppColors.textMuted, marginTop: 2 }}>{alert.time}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={AppColors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trạng thái tiện ích cơ sở */}
        <Text style={[s.sectionTitle, { fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 12 }]}>
          Tiện ích khuôn viên
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 30 }}>
          {stats.map((st) => (
            <View
              key={st.label}
              style={{
                width: "48%",
                padding: 14,
                borderRadius: 16,
                backgroundColor: AppColors.cardBg,
                borderWidth: 1,
                borderColor: AppColors.cardBorder,
              }}
            >
              <View style={[s.row, s.between, { marginBottom: 8 }]}>
                <Feather name={st.icon} size={18} color={st.color} />
                <Text style={{ fontSize: 11, color: AppColors.textMuted, fontWeight: "500" }}>{st.sub}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: AppColors.text }}>{st.value}</Text>
              <Text style={{ fontSize: 12, color: AppColors.textSecondary, marginTop: 2 }}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

