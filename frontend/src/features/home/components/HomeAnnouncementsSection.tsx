import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Thông báo Sinh viên</Text>
        {isLoggedIn ? (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!isLoggedIn ? (
        <LoginRequiredCard
          mode="card"
          icon="file-text"
          title="Vui lòng đăng nhập để xem thông báo sinh viên"
          message="Đăng nhập tài khoản sinh viên để xem chi tiết các thông báo học vụ, lịch thi và học bổng."
        />
      ) : (
        <View style={styles.list}>
          {announcements.slice(0, 3).map((ann, idx) => (
            <TouchableOpacity
              key={ann.id || idx}
              onPress={() => onOpenDetail(ann, idx)}
              activeOpacity={0.7}
              style={styles.card}
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
                            : "#ECFDF5",
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
                          ? "#D97706"
                          : "#059669"
                      }
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            ann.isFallback || ann.badge?.toLowerCase().includes("mẫu")
                              ? "#D97706"
                              : "#059669",
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
                      <Feather name="paperclip" size={9} color="#475569" />
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
                  <Feather name="home" size={11} color="#64748B" />
                  <Text style={styles.authorText} numberOfLines={1}>
                    {ann.author || ann.sender || "Phòng Công tác SV"}
                  </Text>
                </View>
                <View style={styles.detailBtn}>
                  <Text style={styles.detailText}>Chi tiết</Text>
                  <Feather name="arrow-right" size={11} color="#2563EB" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    paddingHorizontal: 7,
    paddingVertical: 2,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  attachText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  dateText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
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
    color: "#64748B",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
});

