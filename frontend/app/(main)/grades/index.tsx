import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { saveGradesForWidget } from "../../../src/services/widgetService";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "../../../src/context/ThemeContext";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetGrades, readLocalCache } from "../../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTabBarScrollHandler } from "../../../src/components/MainTabs";
import { GradesSkeleton } from "../../../src/components/Skeleton";
import { LoginRequiredCard } from "../../../src/components/LoginRequiredCard";
import { CourseDetailModal } from "../../../src/features/grades/components/CourseDetailModal";

interface CourseGrade {
  code: string;
  name: string;
  credits: number;
  grade10: number;
  gradeLetter: string;
  semester: string;
  dbp?: number | null;
  thi1?: number | null;
  thi2?: number | null;
  d1?: number | null;
  d2?: number | null;
  namHoc?: string;
  ky?: string;
  hocPhi?: string;
}

const FALLBACK_GRADES: CourseGrade[] = [];

export default function GradesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { onScroll: onTabBarScroll, bottomPadding } = useTabBarScrollHandler();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [studentInfo, setStudentInfo] = useState<{ mssv: string; name: string }>({ mssv: "", name: "" });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseGrade | null>(null);

  const fetchGrades = async () => {
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

      const isRealAccount = Boolean(mssv && mssv !== "guest");
      setIsLoggedIn(isRealAccount);
      if (!isRealAccount) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const cacheKey = `@offline_grades_${mssv}`;
      const cached = await readLocalCache<any>(cacheKey);
      if (cached && cached.data && Array.isArray(cached.data.data) && cached.data.data.length > 0) {
        const parsed: CourseGrade[] = cached.data.data.map((item: any) => ({
          code: item.code || "",
          name: item.ten_hp || item.name || "Học phần",
          credits: Number(item.so_tin_chi || item.credits || 3),
          grade10: item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp)) ? Number(item.diem_hp) : (item.grade10 ? Number(item.grade10) : 0),
          gradeLetter: item.diem_chu || (item.diem_hp >= 8.5 ? "A" : item.diem_hp >= 7.0 ? "B" : item.diem_hp >= 5.5 ? "C" : item.diem_hp >= 4.0 ? "D" : "F"),
          semester: item.hoc_ky || (item.ky ? `HK${item.ky} (${item.nam_hoc || "2026"})` : "HK1 (2026)"),
          dbp: item.diem_dbp !== null && item.diem_dbp !== undefined && !isNaN(Number(item.diem_dbp)) ? Number(item.diem_dbp) : null,
          thi1: item.diem_thi1 !== null && item.diem_thi1 !== undefined && !isNaN(Number(item.diem_thi1)) ? Number(item.diem_thi1) : null,
          thi2: item.diem_thi2 !== null && item.diem_thi2 !== undefined && !isNaN(Number(item.diem_thi2)) ? Number(item.diem_thi2) : null,
          d1: item.diem_1 !== null && item.diem_1 !== undefined && !isNaN(Number(item.diem_1)) ? Number(item.diem_1) : null,
          d2: item.diem_2 !== null && item.diem_2 !== undefined && !isNaN(Number(item.diem_2)) ? Number(item.diem_2) : null,
          namHoc: item.nam_hoc || "",
          ky: item.ky || "",
          hocPhi: item.hoc_phi || "",
        }));
        setGrades(parsed);
        setLoading(false);
      }

      const res = await apiGetGrades(isRealAccount ? mssv : undefined);
      if (res && res.isOfflineCache) {
        setIsOfflineData(true);
        setCachedAt(res.cachedAt || null);
      } else {
        setIsOfflineData(false);
      }

      if (res && res.success) {
        if (res.ho_ten && (!name || name === "Sinh viên")) {
          setStudentInfo((prev) => ({ ...prev, name: res.ho_ten }));
        }
        if (Array.isArray(res.data)) {
          if (res.data.length > 0) {
            const parsed: CourseGrade[] = res.data.map((item: any) => ({
              code: item.code || "",
              name: item.ten_hp || item.name || "Học phần",
              credits: Number(item.so_tin_chi || item.credits || 3),
              grade10: item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp)) ? Number(item.diem_hp) : (item.grade10 ? Number(item.grade10) : 0),
              gradeLetter: item.diem_chu || (item.diem_hp >= 8.5 ? "A" : item.diem_hp >= 7.0 ? "B" : item.diem_hp >= 5.5 ? "C" : item.diem_hp >= 4.0 ? "D" : "F"),
              semester: item.hoc_ky || (item.ky ? `HK${item.ky} (${item.nam_hoc || "2026"})` : "HK1 (2026)"),
              dbp: item.diem_dbp !== null && item.diem_dbp !== undefined && !isNaN(Number(item.diem_dbp)) ? Number(item.diem_dbp) : null,
              thi1: item.diem_thi1 !== null && item.diem_thi1 !== undefined && !isNaN(Number(item.diem_thi1)) ? Number(item.diem_thi1) : null,
              thi2: item.diem_thi2 !== null && item.diem_thi2 !== undefined && !isNaN(Number(item.diem_thi2)) ? Number(item.diem_thi2) : null,
              d1: item.diem_1 !== null && item.diem_1 !== undefined && !isNaN(Number(item.diem_1)) ? Number(item.diem_1) : null,
              d2: item.diem_2 !== null && item.diem_2 !== undefined && !isNaN(Number(item.diem_2)) ? Number(item.diem_2) : null,
              namHoc: item.nam_hoc || "",
              ky: item.ky || "",
              hocPhi: item.hoc_phi || "",
            }));
            setGrades(parsed);
          } else if (isRealAccount) {
            setGrades([]);
          }
        }
      }
    } catch {
      // Keep fallbacks
      setIsOfflineData(true);
      if (grades.length === 0) {
        setGrades([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGrades();
  };

  const [selectedSemester, setSelectedSemester] = useState("Tất cả");

  const convertTo4Scale = (score10: number, diemChu?: string): number => {
    if (diemChu) {
      const uc = diemChu.toUpperCase().trim();
      if (uc === "A") return 4.0;
      if (uc === "B") return 3.0;
      if (uc === "C") return 2.0;
      if (uc === "D") return 1.0;
      if (uc === "F") return 0.0;
      if (uc === "P" || uc === "X") return 0.0;
    }
    if (score10 >= 8.5) return 4.0;
    if (score10 >= 7.0) return 3.0;
    if (score10 >= 5.5) return 2.0;
    if (score10 >= 4.0) return 1.0;
    return 0.0;
  };

  const getAcademicRank = (gpa4Value: number) => {
    if (gpa4Value >= 3.6) return { label: "Xuất sắc", color: "#10B981" };
    if (gpa4Value >= 3.2) return { label: "Giỏi", color: "#3B82F6" };
    if (gpa4Value >= 2.5) return { label: "Khá", color: "#F59E0B" };
    if (gpa4Value >= 2.0) return { label: "Trung bình", color: "#6B7280" };
    return { label: "Yếu", color: "#EF4444" };
  };

  const semesters = useMemo(
    () => ["Tất cả", ...Array.from(new Set(grades.map((g) => g.semester)))],
    [grades]
  );

  const displayedGrades = useMemo(
    () => grades.filter((g) => (selectedSemester === "Tất cả" ? true : g.semester === selectedSemester)),
    [grades, selectedSemester]
  );

  // Chỉ tính toán GPA và xếp loại khi danh sách môn học hoặc học kỳ thay đổi, giải phóng CPU khi cuộn trang
  const { gpa10, gpa4, totalCredits, academicRank } = useMemo(() => {
    const gradedCourses = displayedGrades.filter(
      (g) => g.gradeLetter !== "X" && g.gradeLetter !== "P" && g.grade10 > 0
    );
    const totalGradedCredits = gradedCourses.reduce((acc, curr) => acc + curr.credits, 0);

    const accumulatedCourses = displayedGrades.filter(
      (g) => g.gradeLetter !== "X" && g.gradeLetter !== "F" && (g.gradeLetter || g.grade10 > 0)
    );
    const totCreds = accumulatedCourses.reduce((acc, curr) => acc + curr.credits, 0);
    const calculatedGpa10 =
      totalGradedCredits > 0
        ? (gradedCourses.reduce((acc, curr) => acc + curr.grade10 * curr.credits, 0) / totalGradedCredits).toFixed(2)
        : "0.00";
    const totalPoints4 = gradedCourses.reduce((acc, curr) => acc + convertTo4Scale(curr.grade10, curr.gradeLetter) * curr.credits, 0);
    const calculatedGpa4 =
      totalGradedCredits > 0 ? (totalPoints4 / totalGradedCredits).toFixed(2) : "0.00";
    const rank = getAcademicRank(Number(calculatedGpa4));

    return {
      gpa10: calculatedGpa10,
      gpa4: calculatedGpa4,
      totalCredits: totCreds,
      academicRank: rank,
    };
  }, [displayedGrades]);

  // Tự động nạp điểm số vào Widget Android khi có dữ liệu điểm
  useEffect(() => {
    if (isLoggedIn && (Number(totalCredits) > 0 || Number(gpa4) > 0)) {
      saveGradesForWidget(
        {
          gpa4,
          gpa10,
          totalCredits: Number(totalCredits),
          rank: academicRank.label,
          rankColor: academicRank.color,
        },
        studentInfo
      ).catch(() => {});
    }
  }, [gpa4, gpa10, totalCredits, academicRank, studentInfo, isLoggedIn]);

  const getBadgeColor = (letter: string) => {
    const uc = (letter || "").toUpperCase().trim();
    if (uc === "A") return isDark ? { bg: "rgba(16, 185, 129, 0.18)", text: "#34D399", border: "rgba(52, 211, 153, 0.3)" } : { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    if (uc === "B") return isDark ? { bg: "rgba(59, 130, 246, 0.18)", text: "#60A5FA", border: "rgba(96, 165, 250, 0.3)" } : { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    if (uc === "C") return isDark ? { bg: "rgba(245, 158, 11, 0.18)", text: "#FBBF24", border: "rgba(251, 191, 36, 0.3)" } : { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
    if (uc === "D") return isDark ? { bg: "rgba(217, 119, 6, 0.18)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.3)" } : { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };
    if (uc === "P") return isDark ? { bg: "rgba(34, 197, 94, 0.18)", text: "#4ADE80", border: "rgba(74, 222, 128, 0.3)" } : { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
    if (uc === "F" || uc === "X") return isDark ? { bg: "rgba(239, 68, 68, 0.18)", text: "#F87171", border: "rgba(248, 113, 113, 0.3)" } : { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
    return isDark ? { bg: "#1E293B", text: "#94A3B8", border: "#334155" } : { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" };
  };

  const subtitle = studentInfo.mssv && studentInfo.mssv !== "guest"
    ? `Bảng điểm của ${studentInfo.name || studentInfo.mssv}`
    : "Tra cứu điểm thi & Điểm tích lũy";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavHeader
        title="Kết quả học tập"
        subtitle={isLoggedIn ? subtitle : "Tra cứu điểm thi & Điểm tích lũy"}
        rightElement={
          isLoggedIn ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                router.push("/(main)/grades/grades_detail");
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  minHeight: 36,
                },
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Xem chi tiết bảng điểm"
            >
              <Feather name="file-text" size={13} color="#FFFFFF" />
              <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#FFFFFF" }}>Chi tiết</Text>
            </Pressable>
          ) : null
        }
      />

      {isLoggedIn === null || (loading && grades.length === 0) ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}>
          <GradesSkeleton />
        </ScrollView>
      ) : !isLoggedIn ? (
        <View style={{ flex: 1, paddingBottom: bottomPadding }}>
          <LoginRequiredCard
            mode="fullscreen"
            icon="bar-chart-2"
            title="Vui lòng đăng nhập để tiếp tục"
            message="Tính năng Kết quả học tập dành riêng cho sinh viên Đại học Tây Nguyên. Vui lòng đăng nhập tài khoản sinh viên để tra cứu điểm thi và GPA."
          />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
          onScroll={onTabBarScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
        {isOfflineData && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
              borderWidth: 1,
              borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <Feather name="wifi-off" size={15} color={isDark ? "#FBBF24" : "#D97706"} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: isDark ? "#FBBF24" : "#92400E", fontWeight: "600", flex: 1 }}>
              Đang xem điểm số lưu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""} • Vuốt xuống để cập nhật lại
            </Text>
          </View>
        )}

        {/* GPA Summary Card */}
        <View
          style={{
            padding: 20,
            borderRadius: 20,
            backgroundColor: colors.primary,
            marginBottom: 16,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View style={[s.row, s.between, { alignItems: "center" }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              TỔNG KẾT ĐIỂM {selectedSemester === "Tất cả" ? "TÍCH LŨY" : selectedSemester.toUpperCase()}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.2)",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Feather name="award" size={12} color="#FFFFFF" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>{academicRank.label}</Text>
            </View>
          </View>

          <View style={[s.row, s.between, { marginTop: 14, alignItems: "flex-end" }]}>
            <View>
              <Text style={{ fontSize: 36, fontWeight: "900", color: "#FFFFFF", lineHeight: 42 }}>{gpa10}</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Thang điểm 10</Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#93C5FD" }}>{gpa4}</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Thang điểm 4</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#FCD34D" }}>{totalCredits}</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Tín chỉ tích lũy</Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push("/(main)/grades/grades_detail");
            }}
            style={({ pressed }) => [
              {
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: "rgba(255, 255, 255, 0.16)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 44, // Touch target >= 44pt
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Xem bảng điểm chi tiết thành phần"
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Xem bảng điểm chi tiết thành phần</Text>
            <Feather name="chevron-right" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* [KHI BUILD APK]: Bỏ comment khối bên dưới để hiện thanh tiện ích Widget & Thông báo điểm
        <View
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.cardBg,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            marginBottom: 16,
            gap: 10,
          }}
        >
          ...
        </View>
        */}

        {/* Bộ lọc học kỳ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {semesters.map((sem) => {
            const isSelected = sem === selectedSemester;
            return (
              <Pressable
                key={sem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedSemester(sem);
                }}
                style={({ pressed }) => [
                  {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: isSelected ? colors.primary : colors.cardBg,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                    minHeight: 38,
                    justifyContent: "center",
                  },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                ]}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Học kỳ ${sem}`}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: isSelected ? "800" : "600",
                    color: isSelected ? "#FFFFFF" : colors.textSecondary,
                  }}
                >
                  {sem}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Danh sách học phần */}
        <View style={[s.row, s.between, { alignItems: "center", marginBottom: 12 }]}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
            Học phần đã có điểm ({displayedGrades.length})
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>Kéo xuống để cập nhật</Text>
        </View>

        {refreshing || (loading && grades.length === 0) ? (
          <GradesSkeleton cardsOnly={true} />
        ) : displayedGrades.length === 0 ? (
          <View
            style={{
              paddingVertical: 40,
              paddingHorizontal: 24,
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Feather name="inbox" size={24} color={colors.textSubtle} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
              Không có học phần nào
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: "center", marginBottom: 14 }}>
              Không tìm thấy điểm của học kỳ này. Bạn có thể chọn xem tất cả học kỳ.
            </Text>
            {selectedSemester !== "Tất cả" && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedSemester("Tất cả");
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : `${colors.primary}12`,
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(99, 102, 241, 0.3)" : `${colors.primary}30`,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 12,
                    minHeight: 44, // Touch target >= 44pt
                    justifyContent: "center",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                  Xem tất cả học kỳ
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {displayedGrades.map((item, idx) => {
              const badge = getBadgeColor(item.gradeLetter);
              return (
                <Pressable
                  key={`${item.name}-${idx}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedCourse(item);
                  }}
                  style={({ pressed }) => [
                    {
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: colors.cardBg,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                    pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Xem chi tiết học phần ${item.name}`}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <View style={[s.row, { gap: 6, marginBottom: 4 }]}>
                      {item.code ? (
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>{item.code}</Text>
                      ) : null}
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {item.code ? "• " : ""}{item.credits} tín chỉ
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{item.semester}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: badge.bg,
                        borderWidth: 1,
                        borderColor: badge.border,
                        alignItems: "center",
                        minWidth: 44,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "900", color: badge.text }}>
                        {item.gradeLetter === "X" ? "Đang học" : item.gradeLetter === "P" ? "Đạt" : item.gradeLetter}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginTop: 4 }}>
                      {item.gradeLetter === "X"
                        ? "Chưa có điểm"
                        : item.gradeLetter === "P"
                        ? "Môn điều kiện"
                        : `${item.grade10.toFixed(1)} / 10`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      )}

      {/* Modal chi tiết từng học phần khi bấm vào */}
      <CourseDetailModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />
    </View>
  );
}

