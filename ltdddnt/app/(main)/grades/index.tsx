import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  { code: "CS301", name: "Cấu trúc dữ liệu & Giải thuật", credits: 4, grade10: 8.0, gradeLetter: "B+", semester: "HK1 (2025-2026)" },
  { code: "IT202", name: "Hệ cơ sở dữ liệu", credits: 3, grade10: 7.5, gradeLetter: "B", semester: "HK1 (2025-2026)" },
  { code: "NT101", name: "Mạng máy tính nâng cao", credits: 3, grade10: 8.8, gradeLetter: "A", semester: "HK1 (2025-2026)" },
  { code: "ENG201", name: "Tiếng Anh chuyên ngành", credits: 2, grade10: 7.0, gradeLetter: "C+", semester: "HK1 (2025-2026)" },
];

export default function GradesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState<CourseGrade[]>(FALLBACK_GRADES);
  const [studentInfo, setStudentInfo] = useState<{ mssv: string; name: string }>({ mssv: "", name: "" });

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
      if (res && res.success && res.data && res.data.length > 0) {
        if (res.ho_ten && (!name || name === "Sinh viên")) {
          setStudentInfo((prev) => ({ ...prev, name: res.ho_ten }));
        }
        const parsed: CourseGrade[] = res.data.map((item: any, idx: number) => ({
          code: item.ma_hp || item.code || `HP-${idx + 1}`,
          name: item.ten_hp || item.name || "Học phần",
          credits: Number(item.so_tin_chi || item.credits || 3),
          grade10: Number(item.diem_hp || item.grade10 || 8.0),
          gradeLetter: item.diem_chu || (item.diem_hp >= 8.5 ? "A" : item.diem_hp >= 7.0 ? "B" : "C"),
          semester: item.hoc_ky || "HK1 (2025-2026)",
        }));
        setGrades(parsed);
      }
    } catch {
      // Keep fallbacks
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

  const totalCredits = grades.reduce((acc, curr) => acc + curr.credits, 0);
  const gpa10 = grades.length > 0
    ? (grades.reduce((acc, curr) => acc + curr.grade10 * curr.credits, 0) / Math.max(totalCredits, 1)).toFixed(2)
    : "0.00";
  const gpa4 = (Number(gpa10) * 0.4).toFixed(2);

  const getBadgeColor = (letter: string) => {
    if (letter.startsWith("A")) return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    if (letter.startsWith("B")) return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    if (letter.startsWith("C")) return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
    return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
  };

  const subtitle = studentInfo.mssv && studentInfo.mssv !== "guest"
    ? `Bảng điểm của ${studentInfo.name || studentInfo.mssv} (${studentInfo.mssv})`
    : "Tra cứu điểm thi & Điểm tích lũy";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top', 'left', 'right']}>
      <NavHeader
        title="Kết quả học tập"
        subtitle={subtitle}
        showBack={true}
        onBack={() => router.push("/(main)/home")}
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
        {/* GPA Summary Card */}
        <View
          style={{
            padding: 20,
            borderRadius: 20,
            backgroundColor: AppColors.primary,
            marginBottom: 20,
            shadowColor: AppColors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            TỔNG KẾT ĐIỂM TÍCH LŨY
          </Text>

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

        {/* Danh sách học phần */}
        <View style={[s.row, s.between, { alignItems: "center", marginBottom: 12 }]}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text }}>
            Học phần đã có điểm ({grades.length})
          </Text>
          <Text style={{ fontSize: 12, color: AppColors.textMuted }}>Kéo xuống để cập nhật</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={{ marginTop: 12, color: AppColors.textMuted, fontSize: 13 }}>Đang tải bảng điểm...</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {grades.map((item, idx) => {
              const badge = getBadgeColor(item.gradeLetter);
              return (
                <View
                  key={`${item.code}-${idx}`}
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
                      <Text style={{ fontSize: 11, fontWeight: "700", color: AppColors.primary }}>{item.code}</Text>
                      <Text style={{ fontSize: 11, color: AppColors.textMuted }}>• {item.credits} tín chỉ</Text>
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
                      <Text style={{ fontSize: 15, fontWeight: "900", color: badge.text }}>{item.gradeLetter}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginTop: 4 }}>
                      {item.grade10.toFixed(1)} / 10
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

