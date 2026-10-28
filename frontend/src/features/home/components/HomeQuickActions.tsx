import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../context/ThemeContext";

export interface QuickActionItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  screen: string;
  bg: string;
  border: string;
  fg: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  { icon: "navigation", label: "Bản đồ", screen: "map", bg: "#EEF2FF", border: "#E0E7FF", fg: "#6366F1" },
  { icon: "calendar", label: "Lịch học", screen: "schedule", bg: "#E0F2FE", border: "#BAE6FD", fg: "#0284C7" },
  { icon: "message-square", label: "Phản hồi", screen: "feedback", bg: "#FEF3C7", border: "#FDE68A", fg: "#D97706" },
  { icon: "bar-chart-2", label: "Kết quả", screen: "grades", bg: "#DCFCE7", border: "#BBF7D0", fg: "#16A34A" },
];

export const GUEST_QUICK_ACTIONS: QuickActionItem[] = [
  { icon: "navigation", label: "Bản đồ", screen: "map", bg: "#EEF2FF", border: "#E0E7FF", fg: "#6366F1" },
  { icon: "book-open", label: "Tin tức", screen: "home/all_articles", bg: "#E0F2FE", border: "#BAE6FD", fg: "#0284C7" },
  { icon: "message-square", label: "Phản hồi", screen: "feedback", bg: "#FEF3C7", border: "#FDE68A", fg: "#D97706" },
  { icon: "shield", label: "SOS khẩn", screen: "sos", bg: "#FEE2E2", border: "#FECACA", fg: "#DC2626" },
];

export interface HomeQuickActionsProps {
  onNavigate: (screen: string) => void;
  actions?: QuickActionItem[];
}

export const HomeQuickActions = React.memo(function HomeQuickActions({
  onNavigate,
  actions = DEFAULT_QUICK_ACTIONS,
}: HomeQuickActionsProps) {
  const { colors, isDark } = useTheme();

  const handleActionPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNavigate(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Tác vụ nhanh</Text>

      <View style={styles.gridRow}>
        {actions.map((qa) => (
          <Pressable
            key={qa.label}
            onPress={() => handleActionPress(qa.screen)}
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.actionItemPressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Mở tác vụ ${qa.label}`}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark ? colors.cardBg : qa.bg,
                  borderColor: isDark ? colors.cardBorder : qa.border,
                },
              ]}
            >
              <Feather name={qa.icon} size={22} color={qa.fg} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{qa.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24, // Hệ số 8pt
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
    paddingHorizontal: 2,
    letterSpacing: -0.2,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionItem: {
    alignItems: "center",
    width: "22%",
    minHeight: 44, // Touch target
  },
  actionItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18, // Squircle 18pt
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1, // Viền Hairline siêu mỏng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.1,
  },
});
