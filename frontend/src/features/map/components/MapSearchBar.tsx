import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, Keyboard, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
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
 * Tương thích trọn vẹn Dark Mode OLED/Slate.
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
  const { colors, isDark } = useTheme();

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
      <View
        style={[
          styles.searchPill,
          {
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.96)" : "rgba(255, 255, 255, 0.96)",
            borderColor: isDark ? "rgba(51, 65, 85, 0.95)" : "rgba(226, 232, 240, 0.95)",
          },
        ]}
      >
        <Feather name="search" size={17} color={colors.primary} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Tìm tòa nhà, phòng học (vd: 2.20, 8.3.4)..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={onSearchChange}
          onFocus={onFocus}
          returnKeyType="search"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            onSubmitSearch?.();
          }}
          style={[styles.searchInput, { color: colors.text }]}
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
            <Feather name="x-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={[styles.countBadgePill, { backgroundColor: isDark ? "rgba(91, 97, 244, 0.2)" : `${colors.primary}12` }]}>
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>
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
                    backgroundColor: isActive
                      ? colors.primary
                      : isDark
                      ? colors.cardBg
                      : "rgba(255, 255, 255, 0.94)",
                    borderColor: isActive ? colors.primary : colors.cardBorder,
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
                  color={isActive ? "#FFFFFF" : colors.primary}
                />
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: isActive ? "800" : "600",
                    color: isActive ? "#FFFFFF" : colors.text,
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
        <View style={[styles.suggestionsBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={[styles.suggestionsHeader, { backgroundColor: isDark ? "#0F172A" : AppColors.muted, borderColor: colors.cardBorder }]}>
            <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
              Gợi ý ({searchResults.length})
            </Text>
            <Pressable
              onPress={handleClearPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Đóng gợi ý tìm kiếm"
            >
              <Text style={[styles.closeSuggestionsText, { color: colors.primary }]}>Đóng</Text>
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
                      backgroundColor: isRoomMatch
                        ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#F0FDF4")
                        : colors.cardBg,
                      borderBottomColor: colors.cardBorder,
                    },
                    pressed && styles.suggestionItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn địa điểm ${loc.name}`}
                >
                  <View
                    style={[
                      styles.locIconBox,
                      { backgroundColor: loc.color || colors.primary },
                    ]}
                  >
                    <Feather name={(loc.icon as any) || "map-pin"} size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.locNameText, { color: colors.text }]} numberOfLines={1}>
                      {loc.name}
                    </Text>
                    {isRoomMatch ? (
                      <View style={styles.roomMatchRow}>
                        <Feather name="check-circle" size={11} color={colors.success} />
                        <Text style={[styles.roomMatchText, { color: colors.success }]}>
                          Khớp phòng: {parsed.fullDisplay}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.locSubtitleText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                      </Text>
                    )}
                  </View>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={isRoomMatch ? colors.success : colors.textSubtle}
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
    borderWidth: 1, // Viền Hairline siêu mỏng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
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
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
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
    borderRadius: 20, // Squircle bo lớn
    maxHeight: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  suggestionsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  closeSuggestionsText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
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
  },
  roomMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  roomMatchText: {
    fontSize: 11,
    fontWeight: "800",
  },
  locSubtitleText: {
    fontSize: 11,
  },
});
