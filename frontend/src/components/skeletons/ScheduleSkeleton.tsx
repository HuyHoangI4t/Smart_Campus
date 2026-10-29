import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Thời khóa biểu (ScheduleScreen)
 * Khớp hoàn hảo với ScheduleWeekBar, ScheduleDayBar và ScheduleCard
 */
export function ScheduleSkeleton({ cardsOnly = false }: { cardsOnly?: boolean }) {
  const { colors, isDark } = useTheme();

  const renderCards = () => (
    <View style={styles.cardListContainer}>
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
              <SkeletonBox width={78} height={24} borderRadius={8} />
              <SkeletonBox width={82} height={24} borderRadius={8} />
            </View>
            <SkeletonBox width={105} height={24} borderRadius={8} />
          </View>

          {/* Tên môn học */}
          <SkeletonBox width="88%" height={20} borderRadius={5} style={{ marginTop: 14, marginBottom: 6 }} />
          <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginBottom: 14 }} />

          {/* Bottom Section: Phòng học + Giảng viên */}
          <View style={[styles.bottomInfoRow, { borderColor: colors.cardBorder }]}>
            <View style={{ flex: 1, gap: 8 }}>
              {/* Phòng học */}
              <View style={styles.rowCenter}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? "#1E293B" : "#EFF6FF" }]}>
                  <SkeletonBox width={14} height={14} borderRadius={7} />
                </View>
                <SkeletonBox width={95} height={15} borderRadius={4} style={{ marginLeft: 8 }} />
              </View>

              {/* Giảng viên */}
              <View style={styles.rowCenter}>
                <SkeletonBox width={14} height={14} borderRadius={7} style={{ marginRight: 8, marginLeft: 5 }} />
                <SkeletonBox width={130} height={14} borderRadius={4} />
              </View>
            </View>

            {/* Nút chỉ đường hình tròn */}
            <SkeletonBox width={36} height={36} borderRadius={18} />
          </View>

          {/* Footer: Nút xem sơ đồ phòng học */}
          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            <SkeletonBox width="100%" height={42} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );

  if (cardsOnly) {
    return renderCards();
  }

  return (
    <View style={styles.fullScreenContainer}>
      {/* 1. Thanh chọn tuần học (WeekBar - Pinned at top) */}
      <View style={[styles.weekBarContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.weekNavRow}>
          <SkeletonBox width={32} height={36} borderRadius={10} />
          <View style={{ flexDirection: "row", gap: 8, flex: 1, justifyContent: "center" }}>
            <SkeletonBox width={105} height={36} borderRadius={18} />
            <SkeletonBox width={140} height={36} borderRadius={18} />
            <SkeletonBox width={95} height={36} borderRadius={18} />
          </View>
          <SkeletonBox width={32} height={36} borderRadius={10} />
        </View>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <SkeletonBox width={88} height={14} borderRadius={4} />
        </View>
      </View>

      {/* 2. Thanh chọn thứ trong tuần (DayBar - Pinned horizontally) */}
      <View style={[styles.dayBarContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
          {[
            { day: "Thứ 2", active: true },
            { day: "Thứ 3", active: false },
            { day: "Thứ 4", active: false },
            { day: "Thứ 5", active: false },
            { day: "Thứ 6", active: false },
            { day: "Thứ 7", active: false },
            { day: "CN", active: false },
          ].map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.dayPill,
                {
                  backgroundColor: item.active ? (isDark ? colors.cardBorder : "#EEF2FF") : colors.cardBg,
                  borderColor: item.active ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <SkeletonBox width={34} height={12} borderRadius={3} style={{ marginBottom: 4 }} />
              <SkeletonBox width={26} height={10} borderRadius={3} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 3. Danh sách ca học bên trong ScrollView */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {renderCards()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  cardListContainer: {
    paddingBottom: 16,
  },
  weekBarContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  dayBarContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dayScrollContent: {
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 8,
  },
  dayPill: {
    width: 54,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  scheduleCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
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
