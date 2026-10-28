import React from "react";
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
import { LoginRequiredCard } from "../../../components/LoginRequiredCard";
import { NotificationAlertItem } from "../types";

export interface HomeAlertsSectionProps {
  isLoggedIn: boolean;
  notificationAlerts: NotificationAlertItem[];
  onSelectAlert: (alert: NotificationAlertItem) => void;
  onDismissAlert?: (alertId: string | number) => void;
  onDismissAll?: () => void;
}

export const HomeAlertsSection = React.memo(function HomeAlertsSection({
  isLoggedIn,
  notificationAlerts,
  onSelectAlert,
  onDismissAlert,
  onDismissAll,
}: HomeAlertsSectionProps) {
  const { colors, isDark } = useTheme();

  const handleAlertPress = (item: NotificationAlertItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelectAlert(item);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Text style={[styles.title, { color: colors.text }]}>Thông báo & Cảnh báo</Text>
          {isLoggedIn && notificationAlerts && notificationAlerts.length > 0 ? (
            <Text
              style={[
                styles.countBadge,
                {
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#EFF6FF",
                  color: isDark ? "#60A5FA" : colors.info,
                },
              ]}
            >
              {notificationAlerts.length} tin mới
            </Text>
          ) : null}
        </View>

        {isLoggedIn && notificationAlerts && notificationAlerts.length > 0 && onDismissAll ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              onDismissAll();
            }}
            style={[
              styles.clearAllBtn,
              isDark && { backgroundColor: "rgba(239, 68, 68, 0.2)" },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Xoá tất cả thông báo"
          >
            <Feather name="trash-2" size={12} color="#EF4444" />
            <Text style={styles.clearAllText}>Xoá tất cả</Text>
          </TouchableOpacity>
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
            let bg = isDark ? "rgba(16, 185, 129, 0.15)" : "#F0FDF4";
            let border = isDark ? "rgba(16, 185, 129, 0.35)" : "#BBF7D0";
            let iconColor = colors.success;
            let iconName: keyof typeof Feather.glyphMap = "check";

            if (item.variant === "warning") {
              bg = isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB";
              border = isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A";
              iconColor = colors.warning;
              iconName = "alert-triangle";
            } else if (item.variant === "info") {
              bg = isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF";
              border = isDark ? "rgba(59, 130, 246, 0.35)" : "#BFDBFE";
              iconColor = colors.info;
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
                  <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
                    {item.date || item.subtitle || "Hôm nay"}
                  </Text>
                </View>

                {onDismissAlert ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      onDismissAlert(item.id);
                    }}
                    style={styles.quickDismissBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Xoá thông báo ${item.title}`}
                  >
                    <Feather name="x" size={15} color={colors.textSubtle} />
                  </TouchableOpacity>
                ) : (
                  <Feather name="chevron-right" size={16} color={colors.textSubtle} />
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Feather name="bell-off" size={16} color={colors.textSubtle} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có thông báo từ trường</Text>
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
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
  },
  countBadge: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  quickDismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148, 163, 184, 0.12)",
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
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  emptyCard: {
    borderWidth: 1,
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
    fontWeight: "500",
  },
});
