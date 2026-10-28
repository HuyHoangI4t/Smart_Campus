import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
import { AvailableWeekItem } from "../types";
import {
  parseWeekRangeDates,
  formatDateVN,
  generateDefaultAvailableWeeks,
} from "../utils/dateUtils";

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
 * - Các chip dạng viên con nhộng (Pill capsule), nút chuyển nhanh Tuần trước (<) / Tuần sau (>)
 * - Tự động bổ sung các tuần lân cận nếu API chỉ có 1 tuần hoặc rỗng, đảm bảo KHÔNG BAO GIỜ bị mất bộ chọn tuần.
 * - Nút "Về tuần này" giúp quay lại nhanh khi đang xem tuần khác.
 * - Hiệu ứng chuyển nền đậm kèm rung xúc giác (Light Haptics), touch target đạt chuẩn >= 44pt.
 */
export const ScheduleWeekBar = React.memo(function ScheduleWeekBar({
  availableWeeks,
  selectedWeekIndex,
  currentWeekIndex,
  nextWeekIndex,
  isSunday,
  onSelectWeek,
}: ScheduleWeekBarProps) {
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  // Danh sách các tuần thực tế (luôn đảm bảo có ít nhất Tuần trước, Tuần này, Tuần sau)
  const effectiveWeeks = useMemo<AvailableWeekItem[]>(() => {
    if (!availableWeeks || availableWeeks.length === 0) {
      return generateDefaultAvailableWeeks();
    }

    if (availableWeeks.length === 1) {
      const single = availableWeeks[0];
      const parsed = parseWeekRangeDates(single.weekRange);
      if (parsed.startDate && parsed.endDate) {
        const s = parsed.startDate;
        const e = parsed.endDate;

        // Tuần trước (-7 ngày)
        const prevMon = new Date(s.getFullYear(), s.getMonth(), s.getDate() - 7);
        const prevSun = new Date(e.getFullYear(), e.getMonth(), e.getDate() - 7);
        const prevRange = `Từ ngày ${formatDateVN(prevMon)} đến ngày ${formatDateVN(prevSun)}`;

        // Tuần sau (+7 ngày)
        const nextMon = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7);
        const nextSun = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 7);
        const nextRange = `Từ ngày ${formatDateVN(nextMon)} đến ngày ${formatDateVN(nextSun)}`;

        return [
          {
            index: 0,
            weekRange: prevRange,
            label: "Tuần trước",
            isCurrent: false,
            isNext: false,
            schedules: [],
          },
          {
            ...single,
            index: 1,
            label: "Tuần này",
            isCurrent: true,
            isNext: false,
          },
          {
            index: 2,
            weekRange: nextRange,
            label: "Tuần sau",
            isCurrent: false,
            isNext: true,
            schedules: [],
          },
        ];
      }
    }

    return availableWeeks;
  }, [availableWeeks]);

  const currentIndexInEffective = useMemo(() => {
    const idx = effectiveWeeks.findIndex((w) => w.index === selectedWeekIndex);
    return idx >= 0 ? idx : 0;
  }, [effectiveWeeks, selectedWeekIndex]);

  const canGoPrev = currentIndexInEffective > 0;
  const canGoNext = currentIndexInEffective < effectiveWeeks.length - 1;

  const handleSelect = (w: AvailableWeekItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectWeek(w);
  };

  const handlePrev = () => {
    if (canGoPrev) {
      const prevWeek = effectiveWeeks[currentIndexInEffective - 1];
      if (prevWeek) handleSelect(prevWeek);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      const nextWeek = effectiveWeeks[currentIndexInEffective + 1];
      if (nextWeek) handleSelect(nextWeek);
    }
  };

  const handleReturnToCurrent = () => {
    const cur = effectiveWeeks.find((w) => w.isCurrent || w.index === currentWeekIndex);
    if (cur) handleSelect(cur);
  };

  return (
    <>
      {/* ── 1. THANH CHỌN TUẦN HỌC (PILL CAPSULE HORIZONTAL BAR + QUICK NAV ARROWS) ── */}
      <View
        style={[
          styles.weekContainer,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.navRow}>
          {/* Nút Tuần trước (<) */}
          <Pressable
            disabled={!canGoPrev}
            onPress={handlePrev}
            style={({ pressed }) => [
              styles.arrowButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                opacity: canGoPrev ? (pressed ? 0.7 : 1) : 0.35,
              },
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Xem tuần trước"
          >
            <Feather name="chevron-left" size={17} color={colors.text} />
          </Pressable>

          {/* Danh sách các chip tuần cuộn ngang */}
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.headerLabel}>
              <View style={[styles.headerIconCircle, { backgroundColor: `${colors.primary}1A` }]}>
                <Feather name="calendar" size={13} color={colors.primary} />
              </View>
              <Text style={[styles.headerText, { color: colors.textSecondary }]}>Tuần:</Text>
            </View>

            {effectiveWeeks.map((w) => {
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
                      backgroundColor: isSelectedWeek ? colors.primary : colors.cardBg,
                      borderColor: isSelectedWeek ? colors.primary : colors.cardBorder,
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
                      color: isSelectedWeek ? "#FFFFFF" : colors.text,
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
                            : `${colors.warning}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.nextBadgeText,
                          { color: isSelectedWeek ? "#FFFFFF" : colors.warning },
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

          {/* Nút Tuần sau (>) */}
          <Pressable
            disabled={!canGoNext}
            onPress={handleNext}
            style={({ pressed }) => [
              styles.arrowButton,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                opacity: canGoNext ? (pressed ? 0.7 : 1) : 0.35,
              },
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Xem tuần sau"
          >
            <Feather name="chevron-right" size={17} color={colors.text} />
          </Pressable>
        </View>

        {/* Nút hành động nhanh: Quay về Tuần này khi người dùng đang xem tuần khác */}
        {selectedWeekIndex !== currentWeekIndex && (
          <View style={styles.backToCurrentRow}>
            <Pressable
              onPress={handleReturnToCurrent}
              style={({ pressed }) => [
                styles.backToCurrentBtn,
                {
                  backgroundColor: isDark ? "rgba(37, 99, 235, 0.18)" : "#EFF6FF",
                  borderColor: isDark ? "rgba(37, 99, 235, 0.4)" : "#BFDBFE",
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Quay lại tuần hiện tại"
            >
              <Feather name="rotate-ccw" size={12} color={colors.primary} />
              <Text style={[styles.backToCurrentText, { color: colors.primary }]}>
                Quay lại tuần này
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── 2. BANNER CẢNH BÁO CHỦ NHẬT (SUNDAY PILL BANNER) ── */}
      {isSunday && (
        <View
          style={[
            styles.sundayAlert,
            {
              backgroundColor: isDark ? "#1E293B" : `${colors.info}14`,
              borderColor: isDark ? colors.cardBorder : `${colors.info}26`,
            },
          ]}
        >
          <View style={styles.sundayAlertContent}>
            <Feather name="info" size={14} color={colors.info} />
            <Text style={[styles.sundayAlertText, { color: isDark ? colors.text : "#0369A1" }]}>
              Hôm nay là Chủ nhật. {selectedWeekIndex === nextWeekIndex ? "Đang xem lịch tuần tới." : "Bấm để xem tuần tới."}
            </Text>
          </View>
          {selectedWeekIndex !== nextWeekIndex && (
            <Pressable
              onPress={() => {
                const nw = effectiveWeeks.find((w) => w.index === nextWeekIndex || w.isNext);
                if (nw) handleSelect(nw);
              }}
              style={({ pressed }) => [
                styles.viewNextWeekBtn,
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Xem lịch của tuần tới"
            >
              <Text style={[styles.viewNextWeekText, { color: colors.primary }]}>Xem tuần tới</Text>
            </Pressable>
          )}
          {selectedWeekIndex === nextWeekIndex && (
            <Pressable
              onPress={() => {
                const cw = effectiveWeeks.find((w) => w.index === currentWeekIndex || w.isCurrent);
                if (cw) handleSelect(cw);
              }}
              style={({ pressed }) => [
                styles.viewCurrentWeekBtn,
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Xem lịch của tuần hiện tại"
            >
              <Text style={[styles.viewCurrentWeekText, { color: colors.textSecondary }]}>Xem tuần này</Text>
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  arrowButton: {
    width: 32,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
    alignItems: "center",
  },
  headerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 2,
  },
  headerIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999, // Pill capsule hoàn hảo
    borderWidth: 1,
    minHeight: 36,
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
  backToCurrentRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
    paddingHorizontal: 16,
  },
  backToCurrentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  backToCurrentText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  sundayAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${AppColors.info}14`,
    paddingVertical: 8,
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
    color: "#0369A1",
    fontWeight: "600",
    flex: 1,
  },
  viewNextWeekBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  viewNextWeekText: {
    fontSize: 11,
    fontWeight: "800",
    color: AppColors.primary,
  },
  viewCurrentWeekBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  viewCurrentWeekText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
});
