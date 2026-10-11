import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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

export const ScheduleWeekBar = React.memo(function ScheduleWeekBar({
  availableWeeks,
  selectedWeekIndex,
  currentWeekIndex,
  nextWeekIndex,
  isSunday,
  onSelectWeek,
}: ScheduleWeekBarProps) {
  if (!availableWeeks || availableWeeks.length === 0) return null;

  return (
    <>
      {/* 1. THANH CHỌN TUẦN HỌC */}
      <View style={styles.weekContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerLabel}>
            <Feather name="calendar" size={13} color={AppColors.primary} />
            <Text style={styles.headerText}>Tuần học:</Text>
          </View>

          {availableWeeks.map((w) => {
            const isSelectedWeek = w.index === selectedWeekIndex;
            const matchDates = w.weekRange.match(/(\d{2}\/\d{2})\/\d{4}.*?(\d{2}\/\d{2})\/\d{4}/);
            const shortDates = matchDates ? `${matchDates[1]} - ${matchDates[2]}` : "";
            const displayLabel = w.label
              ? `${w.label}${shortDates ? ` (${shortDates})` : ""}`
              : shortDates || `Tuần ${w.index + 1}`;

            return (
              <TouchableOpacity
                key={w.index}
                onPress={() => onSelectWeek(w)}
                activeOpacity={0.7}
                style={[
                  styles.weekChip,
                  {
                    backgroundColor: isSelectedWeek ? AppColors.primary : "#FFFFFF",
                    borderColor: isSelectedWeek ? AppColors.primary : "#CBD5E1",
                    shadowOpacity: isSelectedWeek ? 0.15 : 0.04,
                    elevation: isSelectedWeek ? 2 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelectedWeek ? "700" : "600",
                    color: isSelectedWeek ? "#FFFFFF" : AppColors.text,
                  }}
                >
                  {displayLabel}
                </Text>
                {w.isNext && isSunday && (
                  <View
                    style={{
                      backgroundColor: isSelectedWeek ? "rgba(255,255,255,0.25)" : "#FEF3C7",
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: isSelectedWeek ? "#FFFFFF" : "#D97706",
                      }}
                    >
                      Tuần tới
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. THÔNG BÁO THÔNG MINH KHI ĐANG LÀ CHỦ NHẬT */}
      {isSunday && selectedWeekIndex === nextWeekIndex && (
        <View style={styles.sundayAlert}>
          <View style={styles.sundayAlertContent}>
            <Feather name="info" size={14} color="#2563EB" />
            <Text style={styles.sundayAlertText}>
              Hôm nay là Chủ nhật: Đang xem trước lịch học Tuần sau
            </Text>
          </View>
          {availableWeeks[currentWeekIndex] && (
            <TouchableOpacity
              onPress={() => onSelectWeek(availableWeeks[currentWeekIndex])}
              style={styles.viewCurrentWeekButton}
            >
              <Text style={styles.viewCurrentWeekText}>Xem tuần này</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  weekContainer: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  headerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  weekChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  sundayAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#BFDBFE",
  },
  sundayAlertContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sundayAlertText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "600",
    flex: 1,
  },
  viewCurrentWeekButton: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewCurrentWeekText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E40AF",
  },
});

