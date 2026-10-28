import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Thời khóa biểu (ScheduleScreen)
 * Khớp hoàn hảo với ScheduleWeekBar, ScheduleDayBar và ScheduleCard
 */
export function ScheduleSkeleton({ cardsOnly = false }: { cardsOnly?: boolean }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {!cardsOnly && (
        <>
          {/* 1. Thanh chọn tuần học (WeekBar) */}
          <View
            style={[
              styles.weekBarContainer,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <SkeletonBox width={32} height={32} borderRadius={16} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SkeletonBox width={120} height={36} borderRadius={18} />
              <SkeletonBox width={130} height={36} borderRadius={18} />
            </View>
            <SkeletonBox width={32} height={32} borderRadius={16} />
          </View>

          {/* 2. Thanh chọn thứ trong tuần (DayBar - 7 day pills) */}
          <View style={styles.dayBarRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View
                key={i}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: i === 1 ? (isDark ? colors.cardBorder : "#EEF2FF") : colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <SkeletonBox width={34} height={12} borderRadius={3} style={{ marginBottom: 4 }} />
                <SkeletonBox width={28} height={10} borderRadius={3} />
              </View>
            ))}
          </View>
        </>
      )}

      {/* 3. Danh sách ca học (ScheduleCard wireframe chuẩn 1:1) */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.scheduleCard,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header Row: Type pill + Status pill + Time pill */}
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <SkeletonBox width={75} height={22} borderRadius={11} />
              <SkeletonBox width={65} height={22} borderRadius={11} />
            </View>
            <SkeletonBox width={85} height={22} borderRadius={11} />
          </View>

          {/* Tên môn học */}
          <SkeletonBox width="85%" height={20} borderRadius={4} style={{ marginTop: 12, marginBottom: 6 }} />
          <SkeletonBox width="55%" height={16} borderRadius={4} style={{ marginBottom: 14 }} />

          {/* Info Rows: Phòng học + Giảng viên */}
          <View style={{ gap: 8, marginBottom: 14 }}>
            <View style={styles.rowCenter}>
              <SkeletonBox width={16} height={16} borderRadius={4} style={{ marginRight: 8 }} />
              <SkeletonBox width={140} height={14} borderRadius={4} />
            </View>
            <View style={styles.rowCenter}>
              <SkeletonBox width={16} height={16} borderRadius={4} style={{ marginRight: 8 }} />
              <SkeletonBox width={110} height={14} borderRadius={4} />
            </View>
          </View>

          {/* Footer: Nút chỉ đường viên con nhộng */}
          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <SkeletonBox width="100%" height={38} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  weekBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  dayBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayPill: {
    width: "13.2%",
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
});
