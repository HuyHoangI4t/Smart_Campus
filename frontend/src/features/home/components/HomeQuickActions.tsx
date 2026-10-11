import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";

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

export interface HomeQuickActionsProps {
  onNavigate: (screen: string) => void;
  actions?: QuickActionItem[];
}

export const HomeQuickActions = React.memo(function HomeQuickActions({
  onNavigate,
  actions = DEFAULT_QUICK_ACTIONS,
}: HomeQuickActionsProps) {
  const handleActionPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNavigate(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tác vụ nhanh</Text>

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
                  backgroundColor: qa.bg,
                  borderColor: qa.border,
                },
              ]}
            >
              <Feather name={qa.icon} size={22} color={qa.fg} />
            </View>
            <Text style={styles.actionLabel}>{qa.label}</Text>
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
    color: AppColors.text,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionItem: {
    alignItems: "center",
    width: "22%",
    minHeight: 80,
  },
  actionItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textSecondary,
    textAlign: "center",
  },
});
