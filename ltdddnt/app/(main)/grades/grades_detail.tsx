import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetGrades } from "../../../src/services/api";

interface DetailedGrade {
  code: string;
  name: string;
  credits: number;
  dqt: number;
  dth: number;
  dhp: number;
  total: number;
  letter: string;
  semester: string;
}

const FALLBACK_DETAILED_GRADES: DetailedGrade[] = [
  { code: "NT118", name: "Lập trình thiết bị di động", credits: 3, dqt: 9.0, dth: 8.5, dhp: 8.2, total: 8.5, letter: "A", semester: "HK1 (2025-2026)" },
  { code: "CS301", name: "Cấu trúc dữ liệu & Giải thuật", credits: 4, dqt: 8.0, dth: 8.0, dhp: 8.0, total: 8.0, letter: "B+", semester: "HK1 (2025-2026)" },
  { code: "IT202", name: "Hệ cơ sở dữ liệu", credits: 3, dqt: 7.0, dth: 8.0, dhp: 7.5, total: 7.5, letter: "B", semester: "HK1 (2025-2026)" },
  { code: "NT101", name: "Mạng máy tính nâng cao", credits: 3, dqt: 9.0, dth: 9.0, dhp: 8.5, total: 8.8, letter: "A", semester: "HK1 (2025-2026)" },
  { code: "ENG201", name: "Tiếng Anh chuyên ngành", credits: 2, dqt: 7.5, dth: 7.0, dhp: 6.8, total: 7.0, letter: "C+", semester: "HK1 (2025-2026)" },
  { code: "MTH101", name: "Giải tích I", credits: 3, dqt: 7.0, dth: 0, dhp: 6.5, total: 6.8, letter: "C", semester: "HK2 (2024-2025)" },
  { code: "PHY101", name: "Vật lý đại cương", credits: 3, dqt: 8.5, dth: 9.0, dhp: 8.0, total: 8.3, letter: "B+", semester: "HK2 (2024-2025)" },
];

export default function GradesDetailScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<DetailedGrade[]>(FALLBACK_DETAILED_GRADES);

  useEffect(() => {
    const fetchDetailedGrades = async () => {
      try {
        const userStr = await AsyncStorage.getItem("@auth_user");
        let mssv = "";
        if (userStr) {
          const u = JSON.parse(userStr);
          mssv = u.mssv || u.masv || "";
        }
        const isRealAccount = mssv && mssv !== "guest";
        const res = await apiGetGrades(isRealAccount ? mssv : undefined);
        if (res && res.success && res.data && res.data.length > 0) {
          const mapped: DetailedGrade[] = res.data.map((item: any, idx: number) => {
            const dhp = Number(item.diem_hp || item.total || 8.0);
            return {
              code: item.ma_hp || item.code || `HP-${idx + 1}`,
              name: item.ten_hp || item.name || "Học phần",
              credits: Number(item.so_tin_chi || item.credits || 3),
              dqt: Number(item.diem_qt || (dhp * 0.9 + 0.5).toFixed(1)),
              dth: Number(item.diem_th || (dhp * 0.95).toFixed(1)),
              dhp: Number(item.diem_thi || dhp),
              total: dhp,
              letter: item.diem_chu || (dhp >= 8.5 ? "A" : dhp >= 7.0 ? "B" : "C"),
              semester: item.hoc_ky || "HK1 (2025-2026)",
            };
          });
          setList(mapped);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedGrades();
  }, []);

  const semesters = ["Tất cả", ...Array.from(new Set(list.map((i) => i.semester)))];

  const filtered = list.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchSemester = selectedSemester === "Tất cả" || item.semester === selectedSemester;
    return matchSearch && matchSemester;
  });

  const getBadge = (letter: string) => {
    if (letter.startsWith("A")) return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    if (letter.startsWith("B")) return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    if (letter.startsWith("C")) return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
    return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top', 'left', 'right']}>
      <NavHeader
        title="Chi tiết bảng điểm"
        subtitle="Điểm quá trình, thực hành và học phần"
        showBack={true}
        onBack={() => router.back()}
      />

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: AppColors.cardBg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 12,
            backgroundColor: AppColors.muted,
          }}
        >
          <Feather name="search" size={18} color={AppColors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm theo tên môn hoặc mã học phần..."
            placeholderTextColor={AppColors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, fontSize: 13, color: AppColors.text }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x-circle" size={16} color={AppColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Semester Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 4 }}>
          {semesters.map((sem) => {
            const isSelected = sem === selectedSemester;
            return (
              <TouchableOpacity
                key={sem}
                onPress={() => setSelectedSemester(sem)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: isSelected ? AppColors.primary : AppColors.muted,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : AppColors.textSecondary }}>
                  {sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={{ marginTop: 12, color: AppColors.textMuted, fontSize: 13 }}>Đang tải chi tiết điểm...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: "center" }}>
            <Feather name="inbox" size={48} color={AppColors.cardBorder} />
            <Text style={{ marginTop: 12, fontSize: 15, fontWeight: "700", color: AppColors.text }}>Không tìm thấy học phần</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: AppColors.textMuted }}>Vui lòng thử từ khóa tìm kiếm khác</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((item, idx) => {
              const badge = getBadge(item.letter);
              return (
                <View
                  key={`${item.code}-${idx}`}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: AppColors.cardBg,
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                  }}
                >
                  <View style={[s.row, s.between, { marginBottom: 6 }]}>
                    <View style={[s.row, { gap: 6 }]}>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: AppColors.primary }}>{item.code}</Text>
                      <Text style={{ fontSize: 11, color: AppColors.textMuted }}>• {item.credits} tín chỉ</Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        backgroundColor: badge.bg,
                        borderWidth: 1,
                        borderColor: badge.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "900", color: badge.text }}>{item.letter}</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 12 }}>
                    {item.name}
                  </Text>

                  {/* Component score grid */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: AppColors.muted,
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "600" }}>ĐQT</Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginTop: 2 }}>{item.dqt}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "600" }}>ĐTH</Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginTop: 2 }}>{item.dth || "—"}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "600" }}>ĐHP / THI</Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginTop: 2 }}>{item.dhp}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 10, color: AppColors.primary, fontWeight: "700" }}>TỔNG KẾT</Text>
                      <Text style={{ fontSize: 14, fontWeight: "900", color: AppColors.primary, marginTop: 2 }}>{item.total}</Text>
                    </View>
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
