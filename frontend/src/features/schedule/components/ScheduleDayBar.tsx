import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
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

export const ScheduleDayBar = React.memo(function ScheduleDayBar({
  selectedDay,
  todayDayNum,
  isViewingCurrentWeek,
  weekDates,
  onSelectDay,
}: ScheduleDayBarProps) {
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
            <TouchableOpacity
              key={d.num}
              onPress={() => onSelectDay(d.num)}
              activeOpacity={0.7}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isSelected
                    ? AppColors.primary
                    : isToday
                    ? "#EFF6FF"
                    : AppColors.muted,
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                  borderColor: isToday && !isSelected ? AppColors.primary : "transparent",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isSelected
                    ? "#FFFFFF"
                    : isToday
                    ? AppColors.primary
                    : AppColors.textSecondary,
                }}
              >
                {d.label}
              </Text>
              {dateShort && (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 1,
                    color: isSelected
                      ? "rgba(255, 255, 255, 0.85)"
                      : isToday
                      ? AppColors.primary
                      : AppColors.textMuted,
                  }}
                >
                  {dateShort}
                </Text>
              )}
            </TouchableOpacity>
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
  dayChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
  },
});

