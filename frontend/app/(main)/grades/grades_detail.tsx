import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, BackHandler, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { SkeletonBox } from "../../../src/components/Skeleton";
import { apiGetGrades } from "../../../src/services/api";

interface DetailedGrade {
  code: string;
  name: string;
  credits: number;
  namHoc: string;
  ky: string;
  dbp: number | null;
  thi1: number | null;
  thi2: number | null;
  d1: number | null;
  d2: number | null;
  total: number | null;
  letter: string;
  semester: string;
  hocPhi?: string;
  badge?: { bg: string; text: string; border: string; label?: string };
}

const FALLBACK_DETAILED_GRADES: DetailedGrade[] = [
  { code: "", name: "An toàn thông tin", credits: 2.0, namHoc: "2026", ky: "1", dbp: null, thi1: null, thi2: null, d1: null, d2: null, total: null, letter: "X", semester: "HK1 (2026)", hocPhi: "Nợ:1238000" },
  { code: "", name: "Cơ sở vật lý cho Tin học", credits: 2.0, namHoc: "2025", ky: "2", dbp: 9.1, thi1: 5.5, thi2: null, d1: 6.9, d2: null, total: 6.9, letter: "C", semester: "HK2 (2025)", hocPhi: "Nộp:1100000" },
  { code: "", name: "Trí tuệ nhân tạo", credits: 2.0, namHoc: "2025", ky: "2", dbp: 9.0, thi1: 9.0, thi2: null, d1: 9.0, d2: null, total: 9.0, letter: "A", semester: "HK2 (2025)", hocPhi: "Nộp:1100000" },
  { code: "", name: "Các quy trình phát triển phần mềm hiện đại", credits: 2.0, namHoc: "2025", ky: "2", dbp: 8.0, thi1: 8.0, thi2: null, d1: 8.0, d2: null, total: 8.0, letter: "B", semester: "HK2 (2025)", hocPhi: "Nộp:1100000" },
  { code: "", name: "Nhập môn Hệ điều hành", credits: 2.0, namHoc: "2025", ky: "2", dbp: 9.5, thi1: 8.0, thi2: null, d1: 8.5, d2: null, total: 8.5, letter: "A", semester: "HK2 (2025)", hocPhi: "Nộp:1100000" },
];

export default function GradesDetailScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<DetailedGrade[]>(FALLBACK_DETAILED_GRADES);
  const [backendSemesters, setBackendSemesters] = useState<string[]>([]);

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
        if (res.semesters && Array.isArray(res.semesters)) {
          setBackendSemesters(res.semesters);
        }

        const mapped: DetailedGrade[] = res.data.map((item: any) => ({
          code: item.code || "",
          name: item.ten_hp || item.name || "Học phần",
          credits: Number(item.so_tin_chi || 3),
          namHoc: item.nam_hoc || "",
          ky: item.ky || "",
          dbp: item.diem_dbp !== null && item.diem_dbp !== undefined ? Number(item.diem_dbp) : null,
          thi1: item.diem_thi1 !== null && item.diem_thi1 !== undefined ? Number(item.diem_thi1) : null,
          thi2: item.diem_thi2 !== null && item.diem_thi2 !== undefined ? Number(item.diem_thi2) : null,
          d1: item.diem_1 !== null && item.diem_1 !== undefined ? Number(item.diem_1) : null,
          d2: item.diem_2 !== null && item.diem_2 !== undefined ? Number(item.diem_2) : null,
          total: item.diem_hp !== null && item.diem_hp !== undefined ? Number(item.diem_hp) : null,
          letter: item.diem_chu || "X",
          semester: item.hoc_ky || (item.ky ? `HK${item.ky} (${item.nam_hoc || "2026"})` : "HK1 (2026)"),
          hocPhi: item.hoc_phi || "",
          badge: item.badge,
        }));
        setList(mapped);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedGrades();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDetailedGrades();
    setRefreshing(false);
  };

  const semesters = backendSemesters.length > 0 ? backendSemesters : ["Tất cả", ...Array.from(new Set(list.map((i) => i.semester)))];

  const filtered = list.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchSemester = selectedSemester === "Tất cả" || item.semester === selectedSemester;
    return matchSearch && matchSemester;
  });

  const getBadge = (input: any) => {
    if (typeof input === "object" && input?.badge) return input.badge;
    const letter = (typeof input === "string" ? input : (input?.letter || "")).toUpperCase().trim();
    if (letter === "A") return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", label: "A" };
    if (letter === "B") return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", label: "B" };
    if (letter === "C") return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", label: "C" };
    if (letter === "D") return { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A", label: "D" };
    if (letter === "P") return { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", label: "Đạt" };
    if (letter === "F") return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "F" };
    if (letter === "X") return { bg: "#FEF2F2", text: "#EF4444", border: "#FECACA", label: "Đang học" };
    return { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB", label: letter || "X" };
  };

  const handleBackToGrades = useCallback(() => {
    router.replace("/(main)/grades");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackToGrades();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [handleBackToGrades])
  );

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Chi tiết bảng điểm"
        subtitle="Điểm quá trình, thực hành và học phần"
        showBack={true}
        onBack={handleBackToGrades}
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
            placeholder="Tìm theo tên môn học..."
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading || refreshing ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: AppColors.cardBg,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                }}
              >
                <View style={[s.row, s.between, { marginBottom: 8 }]}>
                  <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                    <SkeletonBox width={60} height={14} borderRadius={4} />
                    <SkeletonBox width={70} height={14} borderRadius={4} />
                  </View>
                  <SkeletonBox width={36} height={20} borderRadius={6} />
                </View>
                <SkeletonBox width="85%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: "row", gap: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10 }}>
                  <SkeletonBox width={65} height={28} borderRadius={6} />
                  <SkeletonBox width={65} height={28} borderRadius={6} />
                  <SkeletonBox width={65} height={28} borderRadius={6} />
                </View>
              </View>
            ))}
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
                  key={`${item.name}-${idx}`}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: AppColors.cardBg,
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                  }}
                >
                  <View style={[s.row, s.between, { marginBottom: 6 }]}>
                    <View style={[s.row, { gap: 6, alignItems: "center" }]}>
                      {item.code ? (
                        <Text style={{ fontSize: 11, fontWeight: "800", color: AppColors.primary }}>{item.code}</Text>
                      ) : null}
                      <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                        {item.code ? "• " : ""}{item.credits} tín chỉ
                      </Text>
                      {item.hocPhi ? (
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: item.hocPhi.includes("Nợ") ? "#FEF2F2" : "#F0FDF4",
                            borderWidth: 1,
                            borderColor: item.hocPhi.includes("Nợ") ? "#FECACA" : "#BBF7D0",
                            marginLeft: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: item.hocPhi.includes("Nợ") ? "#DC2626" : "#16A34A",
                            }}
                          >
                            {item.hocPhi}
                          </Text>
                        </View>
                      ) : null}
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
                      <Text style={{ fontSize: 13, fontWeight: "900", color: badge.text }}>
                        {badge.label || (item.letter === "X" ? "Đang học" : item.letter === "P" ? "Đạt" : item.letter)}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 12 }}>
                    {item.name}
                  </Text>

                  {/* 5 cột điểm tương ứng chuẩn 100% với bảng trường: ĐBP | Thi1 | Thi2 | Đ1 | Đ2 */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      borderRadius: 12,
                      backgroundColor: AppColors.muted,
                    }}
                  >
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "700" }}>ĐBP</Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: AppColors.text, marginTop: 3 }}>
                        {item.dbp !== null ? item.dbp : "—"}
                      </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "700" }}>Thi1</Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: AppColors.text, marginTop: 3 }}>
                        {item.thi1 !== null ? item.thi1 : "—"}
                      </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 10, color: AppColors.textMuted, fontWeight: "700" }}>Thi2</Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: AppColors.text, marginTop: 3 }}>
                        {item.thi2 !== null ? item.thi2 : "—"}
                      </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 10, color: AppColors.primary, fontWeight: "700" }}>Đ1</Text>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: AppColors.primary, marginTop: 3 }}>
                        {item.d1 !== null ? item.d1 : (item.total !== null ? item.total : "—")}
                      </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: AppColors.cardBorder }} />
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 10, color: AppColors.primary, fontWeight: "700" }}>Đ2</Text>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: AppColors.primary, marginTop: 3 }}>
                        {item.d2 !== null ? item.d2 : "—"}
                      </Text>
                    </View>
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
