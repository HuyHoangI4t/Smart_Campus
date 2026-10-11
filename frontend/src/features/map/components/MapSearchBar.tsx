import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, Keyboard, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  { id: "WC", label: "WC", icon: "droplet" },
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

/**
 * Thanh tìm kiếm bản đồ nổi (MapSearchBar) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Nền kính mờ Glassmorphism (Vibrancy), hình khối Pill-shape tròn tối đa (borderRadius 999),
 * các chip danh mục con nhộng và viền siêu mỏng Hairline tinh xảo.
 */
const MapSearchBarComponent: React.FC<MapSearchBarProps> = ({
  search,
  showSuggestions,
  searchResults,
  selectedCategory = "all",
  totalLocations = 42,
  onSearchChange,
  onClearSearch,
  onFocus,
  onSelectLocation,
  onSelectCategory,
  onSubmitSearch,
}) => {
  const handleCategoryPress = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Keyboard.dismiss();
    onSelectCategory?.(catId);
  };

  const handleLocationPress = (loc: LocationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Keyboard.dismiss();
    onSelectLocation(loc);
  };

  const handleClearPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Keyboard.dismiss();
    onClearSearch();
  };

  return (
    <View style={styles.container}>
      {/* ── THANH TÌM KIẾM NỔI DẠNG PILL (GLASSMORPHIC SEARCH PILL) ── */}
      <View style={styles.searchPill}>
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
          style={styles.searchInput}
        />
        {search ? (
          <Pressable
            onPress={handleClearPress}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearIconBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Xóa ô tìm kiếm"
          >
            <Feather name="x-circle" size={18} color={AppColors.textMuted} />
          </Pressable>
        ) : (
          <View style={styles.countBadgePill}>
            <Text style={styles.countBadgeText}>
              {totalLocations} điểm
            </Text>
          </View>
        )}
      </View>

      {/* ── THANH CHIP DANH MỤC CON NHỘNG (PILL CAPSULE CATEGORY CHIPS) ── */}
      {onSelectCategory && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CAMPUS_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  {
                    backgroundColor: isActive ? AppColors.primary : "rgba(255, 255, 255, 0.94)",
                    borderColor: isActive ? AppColors.primary : AppColors.cardBorder,
                  },
                  pressed && styles.categoryPillPressed,
                ]}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Lọc danh mục ${cat.label}`}
              >
                <Feather
                  name={cat.icon}
                  size={12}
                  color={isActive ? "#FFFFFF" : AppColors.primary}
                />
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: isActive ? "800" : "600",
                    color: isActive ? "#FFFFFF" : AppColors.text,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* ── DROPDOWN GỢI Ý ĐỊA ĐIỂM (GROUPED INSET SUGGESTIONS) ── */}
      {showSuggestions && searchResults.length > 0 && (
        <View style={styles.suggestionsBox}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>
              Gợi ý ({searchResults.length})
            </Text>
            <Pressable
              onPress={handleClearPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Đóng gợi ý tìm kiếm"
            >
              <Text style={styles.closeSuggestionsText}>Đóng</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {searchResults.map((loc) => {
              const parsed = parseCampusRoom(search);
              const isRoomMatch = Boolean(
                parsed.buildingNumber && HOUSE_NUM_TO_ID[parsed.buildingNumber] === loc.id
              );

              return (
                <Pressable
                  key={loc.id}
                  onPress={() => handleLocationPress(loc)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    {
                      backgroundColor: isRoomMatch ? "#F0FDF4" : AppColors.cardBg,
                    },
                    pressed && styles.suggestionItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn địa điểm ${loc.name}`}
                >
                  <View
                    style={[
                      styles.locIconBox,
                      { backgroundColor: loc.color || AppColors.primary },
                    ]}
                  >
                    <Feather name={(loc.icon as any) || "map-pin"} size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locNameText} numberOfLines={1}>
                      {loc.name}
                    </Text>
                    {isRoomMatch ? (
                      <View style={styles.roomMatchRow}>
                        <Feather name="check-circle" size={11} color={AppColors.success} />
                        <Text style={styles.roomMatchText}>
                          Khớp phòng: {parsed.fullDisplay}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.locSubtitleText} numberOfLines={1}>
                        {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                      </Text>
                    )}
                  </View>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={isRoomMatch ? AppColors.success : AppColors.textSubtle}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export const MapSearchBar = React.memo(MapSearchBarComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 50,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 999, // Pill-shape hoàn hảo
    backgroundColor: "rgba(255, 255, 255, 0.96)", // Glassmorphic translucent surface
    borderWidth: 1, // Viền Hairline siêu mỏng
    borderColor: "rgba(226, 232, 240, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: AppColors.text,
    height: "100%",
    fontWeight: "500",
  },
  clearIconBtn: {
    padding: 4,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999, // Pill-shape
    backgroundColor: `${AppColors.primary}12`,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: AppColors.primary,
  },
  categoryScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 7,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999, // Pill capsule
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 36,
  },
  categoryPillPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.95 }], // Co giãn lò xo mượt mà
  },
  suggestionsBox: {
    marginTop: 6,
    backgroundColor: AppColors.cardBg,
    borderRadius: 20, // Squircle bo lớn
    maxHeight: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    overflow: "hidden",
  },
  suggestionsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: AppColors.muted,
    borderBottomWidth: 1,
    borderColor: AppColors.cardBorder,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: AppColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  closeSuggestionsText: {
    fontSize: 11.5,
    color: AppColors.primary,
    fontWeight: "700",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: AppColors.muted,
    minHeight: 52, // Touch target >= 44pt
  },
  suggestionItemPressed: {
    opacity: 0.75,
  },
  locIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  locNameText: {
    fontSize: 13,
    fontWeight: "800",
    color: AppColors.text,
  },
  roomMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  roomMatchText: {
    fontSize: 11,
    color: AppColors.success,
    fontWeight: "800",
  },
  locSubtitleText: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
});
