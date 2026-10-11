import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { LoginRequiredCard } from "../../../components/LoginRequiredCard";
import { NewsOrAnnouncementItem } from "../../../services/api";

export interface HomeAnnouncementsSectionProps {
  isLoggedIn: boolean;
  announcements: NewsOrAnnouncementItem[];
  onViewAll: () => void;
  onOpenDetail: (item: NewsOrAnnouncementItem, index: number) => void;
}

export const HomeAnnouncementsSection = React.memo(function HomeAnnouncementsSection({
  isLoggedIn,
  announcements,
  onViewAll,
  onOpenDetail,
}: HomeAnnouncementsSectionProps) {
  const handleItemPress = (item: NewsOrAnnouncementItem, idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenDetail(item, idx);
  };

  const handleViewAllPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onViewAll();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Thông báo Sinh viên</Text>
        {isLoggedIn && announcements.length > 0 ? (
          <Pressable
            onPress={handleViewAllPress}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Xem tất cả thông báo sinh viên"
          >
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Feather name="chevron-right" size={14} color={AppColors.accentLight} />
          </Pressable>
        ) : null}
      </View>

      {!isLoggedIn ? (
        <LoginRequiredCard
          mode="card"
          icon="file-text"
          title="Vui lòng đăng nhập để xem thông báo sinh viên"
          message="Đăng nhập tài khoản sinh viên để xem chi tiết các thông báo học vụ, lịch thi và học bổng."
        />
      ) : announcements.length === 0 ? (
        /* Empty State chỉn chu */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={24} color={AppColors.textSubtle} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thông báo mới</Text>
          <Text style={styles.emptySubtitle}>
            Các thông báo học vụ, lịch thi và học bổng mới nhất sẽ hiển thị tại đây khi có tin tức mới.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {announcements.slice(0, 3).map((ann, idx) => (
            <Pressable
              key={ann.id || idx}
              onPress={() => handleItemPress(ann, idx)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Thông báo: ${ann.title}`}
            >
              <View style={styles.badgeRow}>
                <View style={styles.badgeGroup}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          ann.isFallback || ann.badge?.toLowerCase().includes("mẫu")
                            ? "#FEF3C7"
                            : `${AppColors.success}15`,
                      },
                    ]}
                  >
                    <Feather
                      name={
                        ann.isFallback || ann.badge?.toLowerCase().includes("mẫu")
                          ? "alert-triangle"
                          : "bell"
                      }
                      size={10}
                      color={
                        ann.isFallback || ann.badge?.toLowerCase().includes("mẫu")
                          ? AppColors.warning
                          : AppColors.success
                      }
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            ann.isFallback || ann.badge?.toLowerCase().includes("mẫu")
                              ? AppColors.warning
                              : AppColors.success,
                        },
                      ]}
                    >
                      {ann.isFallback || ann.badge?.toLowerCase().includes("mẫu")
                        ? "Dữ liệu mẫu"
                        : ann.badge || "Thông báo SV"}
                    </Text>
                  </View>
                  {ann.attachments && ann.attachments.length > 0 ? (
                    <View style={styles.attachBadge}>
                      <Feather name="paperclip" size={9} color={AppColors.textSecondary} />
                      <Text style={styles.attachText}>
                        {ann.attachments.length} file
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.dateText}>{ann.date}</Text>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {ann.title}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.authorRow}>
                  <Feather name="home" size={11} color={AppColors.textMuted} />
                  <Text style={styles.authorText} numberOfLines={1}>
                    {ann.author || ann.sender || "Phòng Công tác SV"}
                  </Text>
                </View>
                <View style={styles.detailBtn}>
                  <Text style={styles.detailText}>Chi tiết</Text>
                  <Feather name="arrow-right" size={11} color={AppColors.accentLight} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24, // Hệ số 8pt
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: AppColors.text,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 44,
    justifyContent: "center",
  },
  viewAllButtonPressed: {
    opacity: 0.7,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.accentLight,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  attachBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: AppColors.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attachText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 10.5,
    color: AppColors.textMuted,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: AppColors.text,
    lineHeight: 19,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: AppColors.muted,
    paddingTop: 8,
    marginTop: 4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  authorText: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.accentLight,
  },
  emptyContainer: {
    backgroundColor: AppColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
