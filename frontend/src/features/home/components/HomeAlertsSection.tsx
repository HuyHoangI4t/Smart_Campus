import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LoginRequiredCard } from "../../../components/LoginRequiredCard";
import { NotificationAlertItem } from "../types";

export interface HomeAlertsSectionProps {
  isLoggedIn: boolean;
  notificationAlerts: NotificationAlertItem[];
  onSelectAlert: (alert: NotificationAlertItem) => void;
}

export const HomeAlertsSection = React.memo(function HomeAlertsSection({
  isLoggedIn,
  notificationAlerts,
  onSelectAlert,
}: HomeAlertsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Thông báo & Cảnh báo</Text>
        {isLoggedIn && notificationAlerts && notificationAlerts.length > 0 ? (
          <Text style={styles.countBadge}>{notificationAlerts.length} tin mới</Text>
        ) : null}
      </View>

      {!isLoggedIn ? (
        <LoginRequiredCard
          mode="card"
          icon="bell"
          title="Vui lòng đăng nhập để xem thông báo"
          message="Đăng nhập tài khoản sinh viên để nhận các thông báo, phản hồi và cảnh báo quan trọng từ nhà trường."
        />
      ) : notificationAlerts && notificationAlerts.length > 0 ? (
        <View style={styles.list}>
          {notificationAlerts.map((item) => {
            let bg = "#F0FDF4";
            let border = "#BBF7D0";
            let iconColor = "#10B981";
            let iconName: keyof typeof Feather.glyphMap = "check";

            if (item.variant === "warning") {
              bg = "#FFFBEB";
              border = "#FDE68A";
              iconColor = "#D97706";
              iconName = "alert-triangle";
            } else if (item.variant === "info") {
              bg = "#EFF6FF";
              border = "#BFDBFE";
              iconColor = "#2563EB";
              iconName = "info";
            }

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelectAlert(item)}
                activeOpacity={0.7}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                  },
                ]}
              >
                <Feather name={iconName} size={18} color={iconColor} />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemDate}>
                    {item.date || item.subtitle || "Hôm nay"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Feather name="bell-off" size={16} color="#94A3B8" />
          <Text style={styles.emptyText}>Chưa có thông báo từ trường</Text>
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
  countBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },
  list: {
    gap: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
});

