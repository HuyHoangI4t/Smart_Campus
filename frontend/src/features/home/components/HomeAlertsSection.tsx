import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
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
  const handleAlertPress = (item: NotificationAlertItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectAlert(item);
  };

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
            let iconColor = AppColors.success;
            let iconName: keyof typeof Feather.glyphMap = "check";

            if (item.variant === "warning") {
              bg = "#FFFBEB";
              border = "#FDE68A";
              iconColor = AppColors.warning;
              iconName = "alert-triangle";
            } else if (item.variant === "info") {
              bg = "#EFF6FF";
              border = "#BFDBFE";
              iconColor = AppColors.info;
              iconName = "info";
            }

            return (
              <Pressable
                key={item.id}
                onPress={() => handleAlertPress(item)}
                style={({ pressed }) => [
                  styles.itemCard,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                  },
                  pressed && styles.itemCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Thông báo: ${item.title}`}
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
                <Feather name="chevron-right" size={16} color={AppColors.textSubtle} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Feather name="bell-off" size={16} color={AppColors.textSubtle} />
          <Text style={styles.emptyText}>Chưa có thông báo từ trường</Text>
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
  countBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.info,
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
    minHeight: 56, // Touch target đảm bảo >= 44pt
  },
  itemCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: AppColors.cardBg,
    borderWidth: 1,
    borderColor: AppColors.cardBorder,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
});
