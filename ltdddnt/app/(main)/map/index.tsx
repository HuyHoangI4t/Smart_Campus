import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetMapLocations } from "../../../src/services/api";

interface LocationItem {
  id: string | number;
  name: string;
  category: string;
  building: string;
  floor?: string;
  description?: string;
  status?: string;
}

const FALLBACK_LOCATIONS: LocationItem[] = [
  { id: 1, name: "Thư viện Trung tâm", category: "Học tập", building: "Tòa A", floor: "Tầng 2 - 4", description: "Không gian tự học, phòng đọc mở và máy tính tra cứu." },
  { id: 2, name: "Giảng đường B201 - B204", category: "Giảng đường", building: "Tòa B", floor: "Tầng 2", description: "Khu vực phòng học lý thuyết chuyên ngành." },
  { id: 3, name: "Phòng Thực hành Máy tính Lab 1 - 3", category: "Phòng máy", building: "Tòa C", floor: "Tầng 3", description: "Hệ thống máy tính cấu hình cao phục vụ lập trình." },
  { id: 4, name: "Căng tin Sinh viên", category: "Dịch vụ", building: "Khu Dịch vụ", floor: "Tầng trệt", description: "Khu ẩm thực, nước uống và nghỉ ngơi trưa." },
  { id: 5, name: "Văn phòng Đoàn - Hội Sinh viên", category: "Hành chính", building: "Tòa Nhà Điều Hành", floor: "Tầng 1", description: "Hỗ trợ công tác sinh viên, thủ tục hành chính." },
  { id: 6, name: "Trạm Y tế Trường", category: "Y tế", building: "Tòa A", floor: "Tầng trệt", description: "Sơ cấp cứu và chăm sóc sức khỏe sinh viên." },
  { id: 7, name: "Bãi đỗ xe sinh viên Nhà xe số 1", category: "Tiện ích", building: "Khuôn viên Tây", floor: "Mặt đất", description: "Bãi gửi xe máy và xe đạp có mái che bảo vệ." },
];

const CATEGORIES = ["Tất cả", "Giảng đường", "Học tập", "Phòng máy", "Dịch vụ", "Y tế", "Tiện ích"];

export default function MapScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [locations, setLocations] = useState<LocationItem[]>(FALLBACK_LOCATIONS);
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await apiGetMapLocations();
        if (res && res.success && res.locations && res.locations.length > 0) {
          const mapped: LocationItem[] = res.locations.map((l: any, idx: number) => ({
            id: l.id || idx,
            name: l.name || l.ten_dia_diem || "Địa điểm",
            category: l.category || l.loai || "Khuôn viên",
            building: l.building || l.toa_nha || "Khu chính",
            floor: l.floor || l.tang || "Tầng 1",
            description: l.description || l.mo_ta || "Khuôn viên trường Đại học",
          }));
          setLocations(mapped);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filtered = locations.filter((loc) => {
    const matchSearch =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.building.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "Tất cả" || loc.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top', 'left', 'right']}>
      <NavHeader
        title="Bản đồ khuôn viên"
        subtitle="Tìm kiếm tòa nhà, phòng học và tiện ích"
        showBack={true}
        onBack={() => router.push("/(main)/home")}
      />

      {/* Search Input */}
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
            placeholder="Tìm tên phòng, tòa nhà, căng tin, thư viện..."
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

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: isSelected ? AppColors.primary : AppColors.muted,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : AppColors.textSecondary }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected location highlight */}
      {selectedLoc ? (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#EFF6FF",
            borderWidth: 1.5,
            borderColor: "#93C5FD",
          }}
        >
          <View style={[s.row, s.between, { marginBottom: 6 }]}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: AppColors.primary }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>ĐANG CHỌN</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedLoc(null)}>
              <Feather name="x" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: AppColors.text }}>{selectedLoc.name}</Text>
          <Text style={{ fontSize: 12, color: AppColors.primary, fontWeight: "700", marginTop: 2 }}>
            {selectedLoc.building} • {selectedLoc.floor}
          </Text>
          {selectedLoc.description ? (
            <Text style={{ fontSize: 12, color: AppColors.textSecondary, marginTop: 4 }}>
              {selectedLoc.description}
            </Text>
          ) : null}
        </View>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 10 }}>
          Danh sách địa điểm ({filtered.length})
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={{ marginTop: 12, color: AppColors.textMuted, fontSize: 13 }}>Đang tải bản đồ cơ sở...</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((loc) => {
              const isSelected = selectedLoc?.id === loc.id;
              return (
                <TouchableOpacity
                  key={loc.id}
                  onPress={() => setSelectedLoc(loc)}
                  activeOpacity={0.7}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: AppColors.cardBg,
                    borderWidth: 1,
                    borderColor: isSelected ? AppColors.primary : AppColors.cardBorder,
                  }}
                >
                  <View style={[s.row, s.between]}>
                    <View style={{ flex: 1 }}>
                      <View style={[s.row, { gap: 6, marginBottom: 4 }]}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: AppColors.muted }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: AppColors.primary }}>{loc.category}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: AppColors.textMuted }}>{loc.building}</Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: AppColors.text }}>{loc.name}</Text>
                      <Text style={{ fontSize: 12, color: AppColors.textSecondary, marginTop: 2 }}>{loc.floor}</Text>
                    </View>

                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#EEF2FF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name="navigation" size={16} color={AppColors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

