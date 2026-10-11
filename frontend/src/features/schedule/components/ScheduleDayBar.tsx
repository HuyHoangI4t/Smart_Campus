import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
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
  const handleSelectDay = (dayNum: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectDay(dayNum);
  };

  return (
    <View style={styles.dayContainer}>
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
                    ? AppColors.primary
                    : isToday
                    ? `${AppColors.primary}12`
                    : AppColors.cardBg,
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: isToday
                    ? AppColors.primary
                    : AppColors.cardBorder,
                },
                pressed && styles.dayPillPressed,
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`${d.label}${dateShort ? `, ngày ${dateShort}` : ""}${isToday ? ", hôm nay" : ""}${isSelected ? ", đang chọn" : ""}`}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: isSelected
                    ? "#FFFFFF"
                    : isToday
                    ? AppColors.primary
                    : AppColors.text,
                  letterSpacing: -0.2,
                }}
              >
                {d.label}
              </Text>
              {dateShort && (
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "700",
                    marginTop: 1,
                    color: isSelected
                      ? "rgba(255, 255, 255, 0.9)"
                      : isToday
                      ? AppColors.primary
                      : AppColors.textMuted,
                  }}
                >
                  {dateShort}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  dayContainer: {
    paddingVertical: 10,
    backgroundColor: AppColors.cardBg,
    borderBottomWidth: 1,
    borderColor: AppColors.cardBorder,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayPill: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 999, // Pill capsule hoàn hảo
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
    minHeight: 46, // Touch target chuẩn >= 44pt
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dayPillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
