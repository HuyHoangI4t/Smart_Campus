import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { AvailableWeekItem } from "../types";

export interface ScheduleWeekBarProps {
  availableWeeks: AvailableWeekItem[];
  selectedWeekIndex: number;
  currentWeekIndex: number;
  nextWeekIndex: number;
  isSunday: boolean;
  onSelectWeek: (week: AvailableWeekItem) => void;
}

/**
 * Thanh chọn tuần học (ScheduleWeekBar) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Các chip dạng viên con nhộng (Pill capsule: borderRadius 999),
 * hiệu ứng chuyển nền đậm kèm rung xúc giác (Light Haptics), touch target đạt chuẩn >= 44pt.
 */
export const ScheduleWeekBar = React.memo(function ScheduleWeekBar({
  availableWeeks,
  selectedWeekIndex,
  currentWeekIndex,
  nextWeekIndex,
  isSunday,
  onSelectWeek,
}: ScheduleWeekBarProps) {
  if (!availableWeeks || availableWeeks.length === 0) return null;

  const handleSelect = (w: AvailableWeekItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectWeek(w);
  };

  return (
    <>
      {/* ── 1. THANH CHỌN TUẦN HỌC (PILL CAPSULE HORIZONTAL BAR) ── */}
      <View style={styles.weekContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerLabel}>
            <View style={styles.headerIconCircle}>
              <Feather name="calendar" size={13} color={AppColors.primary} />
            </View>
            <Text style={styles.headerText}>Tuần:</Text>
          </View>

          {availableWeeks.map((w) => {
            const isSelectedWeek = w.index === selectedWeekIndex;
            const matchDates = w.weekRange.match(/(\d{2}\/\d{2})\/\d{4}.*?(\d{2}\/\d{2})\/\d{4}/);
            const shortDates = matchDates ? `${matchDates[1]} - ${matchDates[2]}` : "";
            const displayLabel = w.label
              ? `${w.label}${shortDates ? ` (${shortDates})` : ""}`
              : shortDates || `Tuần ${w.index + 1}`;

            return (
              <Pressable
                key={w.index}
                onPress={() => handleSelect(w)}
                style={({ pressed }) => [
                  styles.weekPill,
                  {
                    backgroundColor: isSelectedWeek ? AppColors.primary : AppColors.cardBg,
                    borderColor: isSelectedWeek ? AppColors.primary : AppColors.cardBorder,
                  },
                  pressed && styles.weekPillPressed,
                ]}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`${displayLabel}${isSelectedWeek ? ", đang chọn" : ""}`}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelectedWeek ? "800" : "600",
                    color: isSelectedWeek ? "#FFFFFF" : AppColors.text,
                    letterSpacing: -0.2,
                  }}
                >
                  {displayLabel}
                </Text>

                {w.isNext && isSunday && (
                  <View
                    style={[
                      styles.nextBadgePill,
                      {
                        backgroundColor: isSelectedWeek
                          ? "rgba(255, 255, 255, 0.22)"
                          : `${AppColors.warning}22`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.nextBadgeText,
                        { color: isSelectedWeek ? "#FFFFFF" : AppColors.warning },
                      ]}
                    >
                      Tuần tới
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 2. THÔNG BÁO THÔNG MINH KHI ĐANG LÀ CHỦ NHẬT (TONAL SURFACE ALERT) ── */}
      {isSunday && selectedWeekIndex === nextWeekIndex && (
        <View style={styles.sundayAlert}>
          <View style={styles.sundayAlertContent}>
            <Feather name="info" size={14} color={AppColors.info} />
            <Text style={styles.sundayAlertText}>
              Hôm nay là Chủ nhật: Đang xem trước lịch học Tuần sau
            </Text>
          </View>
          {availableWeeks[currentWeekIndex] && (
            <Pressable
              onPress={() => handleSelect(availableWeeks[currentWeekIndex])}
              style={({ pressed }) => [
                styles.viewCurrentWeekButton,
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Xem lịch của tuần hiện tại"
            >
              <Text style={styles.viewCurrentWeekText}>Xem tuần này</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  weekContainer: {
    backgroundColor: AppColors.background,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  headerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 4,
  },
  headerIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${AppColors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "800",
    color: AppColors.textSecondary,
    letterSpacing: 0.2,
  },
  weekPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999, // Pill capsule hoàn hảo
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  weekPillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  nextBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  nextBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
  },
  sundayAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${AppColors.info}14`, // Tonal Surface Tint
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: `${AppColors.info}26`,
  },
  sundayAlertContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  sundayAlertText: {
    fontSize: 12,
    color: AppColors.info,
    fontWeight: "700",
    flex: 1,
  },
  viewCurrentWeekButton: {
    backgroundColor: AppColors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999, // Pill-shape
    borderWidth: 1,
    borderColor: `${AppColors.info}40`,
    minHeight: 30,
    justifyContent: "center",
  },
  viewCurrentWeekText: {
    fontSize: 11,
    fontWeight: "800",
    color: AppColors.info,
  },
});
