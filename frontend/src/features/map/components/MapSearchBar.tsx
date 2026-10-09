import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Keyboard } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
import { LocationItem } from "../types";
import { parseCampusRoom, HOUSE_NUM_TO_ID } from "../utils";

export interface CampusCategory {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

export const CAMPUS_CATEGORIES: CampusCategory[] = [
  { id: "all", label: "Tất cả", icon: "grid" },
  { id: "Giảng đường", label: "Giảng đường", icon: "book-open" },
  { id: "Hành chính", label: "Hành chính", icon: "briefcase" },
  { id: "Ký túc xá", label: "Ký túc xá", icon: "home" },
  { id: "Học tập", label: "Thư viện", icon: "book" },
  { id: "Y tế", label: "Y tế", icon: "activity" },
  { id: "Thể thao", label: "Thể thao", icon: "award" },
  { id: "Tiện ích", label: "Tiện ích", icon: "coffee" },
];

interface MapSearchBarProps {
  search: string;
  showSuggestions: boolean;
  searchResults: LocationItem[];
  selectedCategory?: string;
  totalLocations?: number;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  onFocus: () => void;
  onSelectLocation: (loc: LocationItem) => void;
  onSelectCategory?: (category: string) => void;
  onSubmitSearch?: () => void;
}

const MapSearchBarComponent: React.FC<MapSearchBarProps> = ({
  search,
  showSuggestions,
  searchResults,
  selectedCategory = "all",
  totalLocations = 37,
  onSearchChange,
  onClearSearch,
  onFocus,
  onSelectLocation,
  onSelectCategory,
  onSubmitSearch,
}) => {
  return (
    <View
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        right: 10,
        zIndex: 50,
      }}
    >
      {/* ── THANH TÌM KIẾM NỔI (FLOATING SEARCH PILL) ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          height: 46,
          borderRadius: 23,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "rgba(226, 232, 240, 0.95)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Feather name="search" size={17} color={AppColors.primary} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Tìm tòa nhà, phòng học (vd: 2.20, 8.3.4)..."
          placeholderTextColor={AppColors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          onFocus={onFocus}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            onSubmitSearch?.();
          }}
          style={{ flex: 1, fontSize: 13, color: AppColors.text, height: "100%", fontWeight: "500" }}
        />
        {search ? (
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              onClearSearch();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x-circle" size={17} color={AppColors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              backgroundColor: "#EEF2FF",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: AppColors.primary }}>
              {totalLocations} điểm
            </Text>
          </View>
        )}
      </View>

      {/* ── THANH CHIP DANH MỤC LƯỚT NGANG (CATEGORY CHIPS) ── */}
      {onSelectCategory && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 8,
            paddingHorizontal: 2,
            gap: 6,
          }}
        >
          {CAMPUS_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  Keyboard.dismiss();
                  onSelectCategory(cat.id);
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isActive ? AppColors.primary : "rgba(255, 255, 255, 0.94)",
                  borderWidth: 1,
                  borderColor: isActive ? AppColors.primary : "#E2E8F0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Feather
                  name={cat.icon}
                  size={12}
                  color={isActive ? "#FFFFFF" : AppColors.primary}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? "800" : "600",
                    color: isActive ? "#FFFFFF" : AppColors.text,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── DROPDOWN GỢI Ý ĐỊA ĐIỂM (SUGGESTIONS LIST) ── */}
      {showSuggestions && searchResults.length > 0 && (
        <View
          style={{
            marginTop: 4,
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            maxHeight: 260,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 10,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: "#F8FAFC",
              borderBottomWidth: 1,
              borderColor: "#E2E8F0",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: AppColors.textSecondary, textTransform: "uppercase" }}>
              Gợi ý ({searchResults.length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onClearSearch();
              }}
            >
              <Text style={{ fontSize: 11, color: AppColors.primary, fontWeight: "700" }}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {searchResults.map((loc) => {
              const parsed = parseCampusRoom(search);
              const isRoomMatch = Boolean(
                parsed.buildingNumber && HOUSE_NUM_TO_ID[parsed.buildingNumber] === loc.id
              );

              return (
                <TouchableOpacity
                  key={loc.id}
                  onPress={() => {
                    Keyboard.dismiss();
                    onSelectLocation(loc);
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderColor: "#F1F5F9",
                    backgroundColor: isRoomMatch ? "#F0FDF4" : "#FFFFFF",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: loc.color || AppColors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Feather name={(loc.icon as any) || "map-pin"} size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }} numberOfLines={1}>
                      {loc.name}
                    </Text>
                    {isRoomMatch ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Feather name="check-circle" size={11} color="#059669" />
                        <Text style={{ fontSize: 11, color: "#059669", fontWeight: "700" }}>
                          Khớp phòng: {parsed.fullDisplay}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, color: AppColors.textSecondary }} numberOfLines={1}>
                        {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                      </Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={16} color={isRoomMatch ? "#059669" : "#94A3B8"} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export const MapSearchBar = React.memo(MapSearchBarComponent);
