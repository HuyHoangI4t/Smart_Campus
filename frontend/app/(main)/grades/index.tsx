import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetGrades } from "../../../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CourseGrade {
  code: string;
  name: string;
  credits: number;
  grade10: number;
  gradeLetter: string;
  semester: string;
}

const FALLBACK_GRADES: CourseGrade[] = [
  { code: "NT118", name: "Lập trình thiết bị di động", credits: 3, grade10: 8.5, gradeLetter: "A", semester: "HK1 (2025-2026)" },
  { code: "CS301", name: "Cấu trúc dữ liệu & Giải thuật", credits: 4, grade10: 8.0, gradeLetter: "B", semester: "HK1 (2025-2026)" },
  { code: "IT202", name: "Hệ cơ sở dữ liệu", credits: 3, grade10: 7.5, gradeLetter: "B", semester: "HK1 (2025-2026)" },
  { code: "NT101", name: "Mạng máy tính nâng cao", credits: 3, grade10: 8.8, gradeLetter: "A", semester: "HK1 (2025-2026)" },
  { code: "ENG201", name: "Tiếng Anh chuyên ngành", credits: 2, grade10: 7.0, gradeLetter: "C", semester: "HK1 (2025-2026)" },
];

export default function GradesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState<CourseGrade[]>(FALLBACK_GRADES);
  const [studentInfo, setStudentInfo] = useState<{ mssv: string; name: string }>({ mssv: "", name: "" });
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

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

      const isRealAccount = mssv && mssv !== "guest";
      const res = await apiGetGrades(isRealAccount ? mssv : undefined);
      if (res && res.isOfflineCache) {
        setIsOfflineData(true);
        setCachedAt(res.cachedAt || null);
      } else {
        setIsOfflineData(false);
      }

      if (res && res.success && res.data && res.data.length > 0) {
        if (res.ho_ten && (!name || name === "Sinh viên")) {
          setStudentInfo((prev) => ({ ...prev, name: res.ho_ten }));
        }
        const parsed: CourseGrade[] = res.data.map((item: any, idx: number) => ({
          code: item.code || "",
          name: item.ten_hp || item.name || "Học phần",
          credits: Number(item.so_tin_chi || item.credits || 3),
          grade10: item.diem_hp !== null && item.diem_hp !== undefined && !isNaN(Number(item.diem_hp)) ? Number(item.diem_hp) : (item.grade10 ? Number(item.grade10) : 0),
          gradeLetter: item.diem_chu || (item.diem_hp >= 8.5 ? "A" : item.diem_hp >= 7.0 ? "B" : "C"),
          semester: item.hoc_ky || "HK1 (2026)",
        }));
        setGrades(parsed);
      }
    } catch {
      // Keep fallbacks
      setIsOfflineData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGrades();
  };

  const [selectedSemester, setSelectedSemester] = useState("Tất cả");

  const convertTo4Scale = (score10: number): number => {
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

  const semesters = ["Tất cả", ...Array.from(new Set(grades.map((g) => g.semester)))];
  const displayedGrades = grades.filter((g) =>
    selectedSemester === "Tất cả" ? true : g.semester === selectedSemester
  );

  // Chỉ tính GPA trên các môn đã có điểm (bỏ qua môn đang học 'X' và môn điều kiện 'P')
  const gradedCourses = displayedGrades.filter(
    (g) => g.gradeLetter !== "X" && g.gradeLetter !== "P" && g.grade10 > 0
  );
  const totalGradedCredits = gradedCourses.reduce((acc, curr) => acc + curr.credits, 0);

  // Tín chỉ tích lũy: Bỏ các môn chưa học/đang học ('X') và môn không đạt ('F')
  const accumulatedCourses = displayedGrades.filter(
    (g) => g.gradeLetter !== "X" && g.gradeLetter !== "F" && (g.gradeLetter || g.grade10 > 0)
  );
  const totalCredits = accumulatedCourses.reduce((acc, curr) => acc + curr.credits, 0);
  const gpa10 = totalGradedCredits > 0 ? (gradedCourses.reduce((acc, curr) => acc + curr.grade10 * curr.credits, 0) / totalGradedCredits).toFixed(2) : "0.00";
  const totalPoints4 = gradedCourses.reduce((acc, curr) => acc + convertTo4Scale(curr.grade10) * curr.credits, 0);
  const gpa4 = totalGradedCredits > 0 ? (totalPoints4 / totalGradedCredits).toFixed(2) : "0.00";
  const academicRank = getAcademicRank(Number(gpa4));

  const getBadgeColor = (letter: string) => {
    const uc = (letter || "").toUpperCase().trim();
    if (uc === "A") return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    if (uc === "B") return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    if (uc === "C") return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
    if (uc === "D") return { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };
    if (uc === "P") return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" };
    if (uc === "F") return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
    if (uc === "X") return { bg: "#FEF2F2", text: "#EF4444", border: "#FECACA" };
    return { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" };
  };

  const subtitle = studentInfo.mssv && studentInfo.mssv !== "guest"
    ? `Bảng điểm của ${studentInfo.name || studentInfo.mssv} (${studentInfo.mssv})`
    : "Tra cứu điểm thi & Điểm tích lũy";

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Kết quả học tập"
        subtitle={subtitle}
        showBack={true}
        onBack={() => router.push("/(main)/grades")}
        rightElement={
          <TouchableOpacity
            onPress={() => router.push("/(main)/grades/grades_detail")}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>Chi tiết</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
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
              Đang xem điểm số lưu ngoại tuyến {cachedAt ? `(lưu lúc ${cachedAt})` : ""} • Vuốt xuống để cập nhật lại
            </Text>
          </View>
        )}

        {/* GPA Summary Card */}
        <View
          style={{
            padding: 20,
            borderRadius: 20,
            backgroundColor: AppColors.primary,
            marginBottom: 16,
            shadowColor: AppColors.primary,
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
              }}
            >
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

          <TouchableOpacity
            onPress={() => router.push("/(main)/grades/grades_detail")}
            activeOpacity={0.8}
            style={{
              marginTop: 16,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Xem bảng điểm chi tiết thành phần</Text>
            <Feather name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

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
              <TouchableOpacity
                key={sem}
                onPress={() => setSelectedSemester(sem)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 18,
                  backgroundColor: isSelected ? AppColors.primary : AppColors.cardBg,
                  borderWidth: 1,
                  borderColor: isSelected ? AppColors.primary : AppColors.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "#FFFFFF" : AppColors.textSecondary,
                  }}
                >
                  {sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Danh sách học phần */}
        <View style={[s.row, s.between, { alignItems: "center", marginBottom: 12 }]}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text }}>
            Học phần đã có điểm ({displayedGrades.length})
          </Text>
          <Text style={{ fontSize: 12, color: AppColors.textMuted }}>Kéo xuống để cập nhật</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={{ marginTop: 12, color: AppColors.textMuted, fontSize: 13 }}>Đang tải bảng điểm...</Text>
          </View>
        ) : displayedGrades.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Feather name="inbox" size={40} color={AppColors.textMuted} />
            <Text style={{ marginTop: 12, color: AppColors.textMuted, fontSize: 14 }}>
              Không có học phần nào trong học kỳ này
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {displayedGrades.map((item, idx) => {
              const badge = getBadgeColor(item.gradeLetter);
              return (
                <View
                  key={`${item.name}-${idx}`}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: AppColors.cardBg,
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <View style={[s.row, { gap: 6, marginBottom: 4 }]}>
                      {item.code ? (
                        <Text style={{ fontSize: 11, fontWeight: "700", color: AppColors.primary }}>{item.code}</Text>
                      ) : null}
                      <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                        {item.code ? "• " : ""}{item.credits} tín chỉ
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: AppColors.text }} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: AppColors.textMuted, marginTop: 2 }}>{item.semester}</Text>
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
                    <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginTop: 4 }}>
                      {item.gradeLetter === "X"
                        ? "Chưa có điểm"
                        : item.gradeLetter === "P"
                        ? "Môn điều kiện"
                        : `${item.grade10.toFixed(1)} / 10`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

