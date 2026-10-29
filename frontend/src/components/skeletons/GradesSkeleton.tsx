import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { SkeletonBox } from "./BaseSkeleton";
import { useTheme } from "../../context/ThemeContext";

/**
 * Skeleton Thẻ điểm học phần - Chuẩn 1:1 với giao diện Course Card thật trong GradesScreen
 */
export function CourseCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.courseCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        {/* Mã học phần • Số tín chỉ */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 4, alignItems: "center" }}>
          <SkeletonBox width={56} height={12} borderRadius={4} />
          <SkeletonBox width={60} height={12} borderRadius={4} />
        </View>

        {/* Tên học phần (2 dòng chuẩn thực tế) */}
        <SkeletonBox width="88%" height={16} borderRadius={4} style={{ marginTop: 4, marginBottom: 4 }} />
        <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />

        {/* Hệ 10: ... • HK... */}
        <SkeletonBox width={120} height={12} borderRadius={4} />
      </View>

      {/* Badge điểm chữ: 44x44, borderRadius 12 */}
      <SkeletonBox width={44} height={44} borderRadius={12} />
    </View>
  );
}

/**
 * Skeleton Thẻ tổng kết GPA Hero - Chuẩn 1:1 với GPA Summary Card thật
 */
export function GpaSummarySkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.gpaHeroCard,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
      ]}
    >
      {/* Header: Tiêu đề & Xếp loại */}
      <View style={styles.rowBetween}>
        <Text style={styles.gpaHeaderLabel}>TỔNG KẾT ĐIỂM TÍCH LŨY</Text>
        <View style={styles.rankPill}>
          <SkeletonBox width={40} height={13} borderRadius={4} backgroundColor="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {/* 3 Cột điểm số: Thang 10, Thang 4, Tín chỉ tích lũy */}
      <View style={[styles.rowBetween, { marginTop: 14, alignItems: "flex-end" }]}>
        <View>
          <SkeletonBox width={72} height={38} borderRadius={6} backgroundColor="rgba(255,255,255,0.3)" />
          <Text style={styles.statSubText}>Thang điểm 10</Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <SkeletonBox width={52} height={26} borderRadius={6} backgroundColor="rgba(255,255,255,0.3)" />
          <Text style={styles.statSubText}>Thang điểm 4</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <SkeletonBox width={48} height={26} borderRadius={6} backgroundColor="rgba(255,255,255,0.3)" />
          <Text style={styles.statSubText}>Tín chỉ tích lũy</Text>
        </View>
      </View>

      {/* Nút Xem chi tiết */}
      <View style={styles.detailButton}>
        <SkeletonBox width={190} height={15} borderRadius={4} backgroundColor="rgba(255,255,255,0.25)" />
      </View>
    </View>
  );
}

/**
 * Skeleton Thanh lọc học kỳ - Chuẩn 1:1 với ScrollView Chips thật
 */
export function SemesterFilterSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.semesterChipsRow}>
      {["Tất cả", "HK1 (2026)", "HK2 (2025)"].map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.semesterChip,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <SkeletonBox width={idx === 0 ? 38 : 72} height={13} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Bảng điểm (GradesScreen)
 * Không làm lệch kích thước giao diện thật
 */
export function GradesSkeleton({ cardsOnly = false }: { cardsOnly?: boolean } = {}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {!cardsOnly && (
        <>
          <GpaSummarySkeleton />
          <SemesterFilterSkeleton />

          {/* Tiêu đề danh sách môn học */}
          <View style={[styles.rowBetween, { marginBottom: 12 }]}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Học phần đã có điểm
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Đang tải dữ liệu...</Text>
          </View>
        </>
      )}

      {/* Danh sách học phần chuẩn 1:1 */}
      <View style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton Wireframe chuẩn 1:1 cho Màn hình Chi tiết bảng điểm (GradesDetailScreen)
 */
export function GradesDetailSkeleton() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={{ gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.detailCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            {/* Hàng trên: Mã môn • tín chỉ & Badge điểm chữ */}
            <View style={[styles.rowBetween, { marginBottom: 6 }]}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <SkeletonBox width={56} height={12} borderRadius={4} />
                <SkeletonBox width={50} height={12} borderRadius={4} />
              </View>
              <SkeletonBox width={36} height={24} borderRadius={8} />
            </View>

            {/* Tên học phần */}
            <SkeletonBox width="85%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />

            {/* Khung 5 cột điểm thành phần: ĐBP | Thi1 | Thi2 | Đ1 | Đ2 */}
            <View
              style={[
                styles.componentContainer,
                {
                  backgroundColor: isDark ? "#0F172A" : colors.muted,
                  borderColor: colors.cardBorder,
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              {[1, 2, 3, 4, 5].map((col, idx) => (
                <React.Fragment key={col}>
                  {idx > 0 && <View style={[styles.verticalDivider, { backgroundColor: colors.cardBorder }]} />}
                  <View style={styles.componentCol}>
                    <SkeletonBox width={24} height={10} borderRadius={2} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={28} height={14} borderRadius={3} />
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  gpaHeroCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  gpaHeaderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rankPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statSubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  detailButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  semesterChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  semesterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  courseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  componentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  componentCol: {
    alignItems: "center",
    flex: 1,
  },
  verticalDivider: {
    width: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
