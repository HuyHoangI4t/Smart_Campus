import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetMapLocations } from "../../../src/services/api";

interface LocationItem {
  id: string | number;
  name: string;
  category: string;
  building: string;
  floor?: string;
  description?: string;
  lat: number;
  lng: number;
  icon?: string;
  x: number;
  y: number;
  color: string;
}

// Danh sách các tòa nhà trọng điểm trong khuôn viên Đại học Tây Nguyên (567 Lê Duẩn, TP. Buôn Ma Thuột)
const TAY_NGUYEN_CAMPUS_LOCATIONS: LocationItem[] = [
  {
    id: 1,
    name: "Tòa Nhà Điều Hành (Khu Hiệu Bộ)",
    category: "Hành chính",
    building: "Tòa Hiệu Bộ",
    floor: "Tầng 1 - 4",
    description: "Ban Giám hiệu, Phòng Đào tạo, Phòng CTSV, Phòng Tài vụ.",
    lat: 12.65195,
    lng: 108.05335,
    icon: "briefcase",
    x: 50,
    y: 18,
    color: "#10B981", // Xanh lá ở đỉnh trục tung 12h
  },
  {
    id: 2,
    name: "Tòa A - Khối Giảng đường chính",
    category: "Giảng đường",
    building: "Tòa A",
    floor: "Tầng 1 - 4",
    description: "Các phòng học lý thuyết A101 - A405, văn phòng các khoa.",
    lat: 12.65228,
    lng: 108.05392,
    icon: "book-open",
    x: 28,
    y: 34,
    color: "#6366F1", // Tím góc trên bên trái
  },
  {
    id: 3,
    name: "Tòa B - Khối Giảng đường Kỹ thuật",
    category: "Giảng đường",
    building: "Tòa B",
    floor: "Tầng 1 - 3",
    description: "Giảng đường B201 - B204, phòng học chuyên đề khối kỹ thuật.",
    lat: 12.65261,
    lng: 108.05371,
    icon: "layers",
    x: 35,
    y: 48,
    color: "#06B6D4", // Cyan bên trái tâm
  },
  {
    id: 4,
    name: "Tòa C - Trung tâm Thực hành CNTT & Labs",
    category: "Phòng máy",
    building: "Tòa C",
    floor: "Tầng 1 - 4",
    description: "Hệ thống phòng máy tính thực hành Lab 1 - 6, máy chủ dữ liệu.",
    lat: 12.65285,
    lng: 108.05425,
    icon: "cpu",
    x: 42,
    y: 58,
    color: "#1E3A8A", // Xanh dương đậm góc dưới trái
  },
  {
    id: 5,
    name: "Thư viện Trung tâm ĐH Tây Nguyên",
    category: "Học tập",
    building: "Tòa Thư viện",
    floor: "Tầng 1 - 3",
    description: "Kho sách, phòng đọc mở, khu vực tự học và tra cứu tài liệu số.",
    lat: 12.65142,
    lng: 108.05415,
    icon: "book",
    x: 65,
    y: 46,
    color: "#F59E0B", // Cam/vàng bên phải tâm
  },
  {
    id: 6,
    name: "Căng tin Sinh viên & Khu Dịch vụ",
    category: "Dịch vụ",
    building: "Khu Căng tin",
    floor: "Tầng trệt",
    description: "Khu ẩm thực, ăn trưa, giải khát và quầy tiện ích sinh viên.",
    lat: 12.65115,
    lng: 108.05315,
    icon: "coffee",
    x: 52,
    y: 70,
    color: "#6366F1", // Tím ở trục dưới 6h
  },
  {
    id: 7,
    name: "Trạm Y tế & Ký túc xá Sinh viên",
    category: "Y tế",
    building: "Khối Dịch vụ Y tế",
    floor: "Tầng trệt",
    description: "Sơ cấp cứu ban đầu, chăm sóc y tế và khu nội trú sinh viên.",
    lat: 12.65215,
    lng: 108.0532,
    icon: "activity",
    x: 22,
    y: 62,
    color: "#6366F1", // Tím góc dưới trái
  },
  {
    id: 8,
    name: "Khu Thể thao & Nhà thi đấu Đa năng",
    category: "Tiện ích",
    building: "Khu Thể thao",
    floor: "Mặt đất",
    description: "Nhà thi đấu, sân bóng đá, bóng rổ, cầu lông rèn luyện thể chất.",
    lat: 12.65075,
    lng: 108.0549,
    icon: "award",
    x: 70,
    y: 64,
    color: "#EF4444", // Đỏ ở góc dưới phải
  },
];

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string }>();
  const [search, setSearch] = useState(params.search ? String(params.search) : "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<LocationItem[]>(TAY_NGUYEN_CAMPUS_LOCATIONS);
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(TAY_NGUYEN_CAMPUS_LOCATIONS[0]);

  useEffect(() => {
    if (params.search) {
      setSearch(String(params.search));
    }
  }, [params.search]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await apiGetMapLocations();
        if (res && res.success && res.locations && res.locations.length > 0) {
          const merged: LocationItem[] = res.locations.map((l: any, idx: number) => {
            const matched = TAY_NGUYEN_CAMPUS_LOCATIONS[idx % TAY_NGUYEN_CAMPUS_LOCATIONS.length];
            return {
              id: l.id || matched.id,
              name: l.name || l.ten_dia_diem || matched.name,
              category: l.category || l.loai || matched.category,
              building: l.building || l.toa_nha || matched.building,
              floor: l.floor || l.tang || matched.floor,
              description: l.description || l.mo_ta || matched.description,
              lat: l.lat || matched.lat,
              lng: l.lng || matched.lng,
              icon: matched.icon || "map-pin",
              x: matched.x,
              y: matched.y,
              color: matched.color,
            };
          });
          setLocations(merged);
        }
      } catch {
        // keep defaults
      }
    };
    fetchLocations();
  }, []);

  // Tìm kiếm theo từ khóa
  const searchResults = locations.filter((loc) => {
    if (!search.trim()) return false;
    const q = search.toLowerCase().trim();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.building.toLowerCase().includes(q) ||
      (loc.description && loc.description.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (search.trim() && locations.length > 0) {
      const q = search.toLowerCase().trim();
      const found = locations.find(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.building.toLowerCase().includes(q)
      );
      if (found) {
        setSelectedLoc(found);
      }
    }
  }, [search, locations]);

  const handleOpenExternalDirections = () => {
    if (!selectedLoc) return;
    const { lat, lng, name } = selectedLoc;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=18`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})&z=18`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.canOpenURL(url as string).then((supported) => {
      if (supported) {
        Linking.openURL(url as string);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* ─── TIÊU ĐỀ NAVHEADER ─────────────────────────────────────────── */}
      <NavHeader
        title="Bản đồ khuôn viên"
        subtitle="Đại học Tây Nguyên • Sơ đồ trực quan"
      />

      {/* ─── Ô TÌM KIẾM Ở TRÊN CÙNG (KHÔNG CÓ DANH MỤC) ───────────────────── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: AppColors.cardBg,
          borderBottomWidth: 1,
          borderColor: AppColors.cardBorder,
          zIndex: 99,
          position: "relative",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 14,
            backgroundColor: AppColors.muted,
          }}
        >
          <Feather name="search" size={18} color={AppColors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm kiếm tòa nhà, giảng đường, thư viện..."
            placeholderTextColor={AppColors.textMuted}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{ flex: 1, fontSize: 13, color: AppColors.text, height: "100%" }}
          />
          {search ? (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setShowSuggestions(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dropdown gợi ý tìm kiếm nổi */}
        {showSuggestions && search.trim().length > 0 && searchResults.length > 0 && (
          <View
            style={{
              position: "absolute",
              top: 58,
              left: 16,
              right: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              maxHeight: 250,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 10,
              borderWidth: 1,
              borderColor: AppColors.cardBorder,
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  onPress={() => {
                    setSelectedLoc(loc);
                    setSearch(loc.name);
                    setShowSuggestions(false);
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderColor: "#F1F5F9",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: loc.color || AppColors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Feather name="map-pin" size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }} numberOfLines={1}>
                      {loc.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: AppColors.textSecondary }} numberOfLines={1}>
                      {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ─── TOÀN BỘ PHẦN CÒN LẠI LÀ BẢN ĐỒ SƠ ĐỒ TRỰC QUAN (FLEX: 1) ──────── */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#F0F4FA",
          position: "relative",
          marginTop: 6,
          marginHorizontal: 12,
          marginBottom: 95, // Đẩy khung bản đồ lên trên thanh TabBar để không bị che
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#E2E8F0",
        }}
      >
        {/* Nút La bàn định vị ở góc trên bên phải */}
        <TouchableOpacity
          onPress={() => setSelectedLoc(TAY_NGUYEN_CAMPUS_LOCATIONS[0])}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Feather name="navigation" size={18} color={AppColors.primary} style={{ transform: [{ rotate: "45deg" }] }} />
        </TouchableOpacity>

        {/* ─── NỘI DUNG SƠ ĐỒ CAMPUS ────────────────────────────────────────── */}
        <View style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}>
          {/* Trục hoành (Horizontal Axis) */}
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: 16,
              right: 16,
              height: 4,
              backgroundColor: "#CBD5E1",
              borderRadius: 2,
            }}
          />

          {/* Trục tung (Vertical Axis) */}
          <View
            style={{
              position: "absolute",
              left: "50%",
              top: 20,
              bottom: 20,
              width: 4,
              backgroundColor: "#CBD5E1",
              borderRadius: 2,
              transform: [{ translateX: -2 }],
            }}
          />

          {/* Đường chéo nét đứt 45 độ */}
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "10%",
              right: "10%",
              height: 1,
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: "#94A3B8",
              transform: [{ rotate: "45deg" }],
            }}
          />

          {/* Đường chéo nét đứt 135 độ */}
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "10%",
              right: "10%",
              height: 1,
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: "#94A3B8",
              transform: [{ rotate: "-45deg" }],
            }}
          />

          {/* Vùng tròn xanh nhạt ở trung tâm khuôn viên */}
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "rgba(187, 247, 208, 0.65)",
              transform: [{ translateX: -70 }, { translateY: -70 }],
            }}
          />

          {/* Khối khuôn viên cỏ / Giảng đường ở góc trên bên trái */}
          <View
            style={{
              position: "absolute",
              top: "30%",
              left: "20%",
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "rgba(187, 247, 208, 0.7)",
            }}
          />

          {/* Chấm tròn định vị trung tâm trường (màu xanh dương) */}
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#3B82F6",
              borderWidth: 3,
              borderColor: "#FFFFFF",
              transform: [{ translateX: -9 }, { translateY: -9 }],
              zIndex: 5,
              elevation: 4,
            }}
          />

          {/* Danh sách các Pin tòa nhà phân bổ trên sơ đồ */}
          {locations.map((loc) => {
            const isSelected = selectedLoc?.id === loc.id;
            return (
              <TouchableOpacity
                key={loc.id}
                onPress={() => setSelectedLoc(loc)}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  left: `${loc.x}%` as any,
                  top: `${loc.y}%` as any,
                  transform: [{ translateX: -18 }, { translateY: -18 }],
                  zIndex: isSelected ? 20 : 10,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: loc.color,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isSelected ? 3 : 2,
                    borderColor: "#FFFFFF",
                    shadowColor: loc.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 6,
                    elevation: isSelected ? 8 : 4,
                    transform: [{ scale: isSelected ? 1.25 : 1 }],
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── THẺ NỔI THÔNG TIN TÒA NHÀ ĐANG CHỌN (GÓC DƯỚI BẢN ĐỒ) ──────── */}
        {selectedLoc && (
          <View
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              right: 10,
              zIndex: 30,
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              borderRadius: 18,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedLoc.color || AppColors.primary }} />
                  <Text style={{ fontSize: 10, fontWeight: "800", color: selectedLoc.color || AppColors.primary }}>
                    {selectedLoc.category?.toUpperCase() || "TÒA NHÀ KHUÔN VIÊN"}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "900", color: AppColors.text }}>
                  {selectedLoc.name}
                </Text>
                <Text style={{ fontSize: 12, color: AppColors.primary, fontWeight: "700", marginTop: 2 }}>
                  {selectedLoc.building} {selectedLoc.floor ? `• ${selectedLoc.floor}` : ""}
                </Text>
                {selectedLoc.description ? (
                  <Text style={{ fontSize: 11, color: AppColors.textSecondary, marginTop: 4 }} numberOfLines={2}>
                    {selectedLoc.description}
                  </Text>
                ) : null}
              </View>

              {/* Cụm nút Chỉ đường và Đóng */}
              <View style={{ gap: 6, alignItems: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => setSelectedLoc(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={14} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenExternalDirections}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: AppColors.primary,
                  }}
                >
                  <Feather name="navigation" size={12} color="#FFFFFF" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Chỉ đường</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
