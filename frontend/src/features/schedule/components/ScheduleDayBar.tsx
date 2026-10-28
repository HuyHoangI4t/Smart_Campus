import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
import { DAYS } from "../constants";
import { WeekDateItem } from "../types";

export interface ScheduleDayBarProps {
  selectedDay: number;
  todayDayNum: number;
  isViewingCurrentWeek: boolean;
  weekDates: WeekDateItem[];
  onSelectDay: (dayNum: number) => void;
}

/**
 * Thanh chọn thứ trong tuần (ScheduleDayBar) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Các chip con nhộng (Pill capsule: borderRadius 999),
 * hiệu ứng chuyển nền đậm kèm rung xúc giác (Light Haptics), touch target đạt chuẩn >= 44pt.
 */
export const ScheduleDayBar = React.memo(function ScheduleDayBar({
  selectedDay,
  todayDayNum,
  isViewingCurrentWeek,
  weekDates,
  onSelectDay,
}: ScheduleDayBarProps) {
  const { colors, isDark } = useTheme();

  const handleSelectDay = (dayNum: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectDay(dayNum);
  };

  return (
    <View
      style={[
        styles.dayContainer,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DAYS.map((d) => {
          const isSelected = d.num === selectedDay;
          const isToday = d.num === todayDayNum && isViewingCurrentWeek;
          const matchedDate = weekDates.find((w) => w.num === d.num);
          const dateShort = matchedDate?.dateShort;

          return (
            <Pressable
              key={d.num}
              onPress={() => handleSelectDay(d.num)}
              style={({ pressed }) => [
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isToday
                    ? `${colors.primary}1A`
                    : colors.cardBg,
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: isToday
                    ? colors.primary
                    : colors.cardBorder,
                  shadowColor: isDark ? "#000000" : "#000",
                },
                pressed && styles.dayPillPressed,
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`${d.label}${dateShort ? `, ngày ${dateShort}` : ""}${isToday ? ", hôm nay" : ""}${isSelected ? ", đang chọn" : ""}`}
            >
              {/* Vòng chấm nhỏ báo hiệu HÔM NAY */}
              {isToday && !isSelected && (
                <View
                  style={[
                    styles.todayDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}

              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: isSelected ? "900" : isToday ? "800" : "600",
                  color: isSelected
                    ? "#FFFFFF"
                    : isToday
                    ? colors.primary
                    : colors.text,
                }}
              >
                {d.label}
              </Text>

              {dateShort ? (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected
                      ? "rgba(255, 255, 255, 0.88)"
                      : colors.textSecondary,
                  }}
                >
                  {dateShort}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  dayContainer: {
    backgroundColor: AppColors.background,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999, // Pill capsule hoàn hảo
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    minHeight: 46, // Touch target tối thiểu >= 44pt
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dayPillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  todayDot: {
    position: "absolute",
    top: 5,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 999,
  },
});
