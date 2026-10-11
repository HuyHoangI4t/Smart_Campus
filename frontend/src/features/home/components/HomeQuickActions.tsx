import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tác vụ nhanh</Text>

      <View style={styles.gridRow}>
        {actions.map((qa) => (
          <TouchableOpacity
            key={qa.label}
            onPress={() => onNavigate(qa.screen)}
            activeOpacity={0.7}
            style={styles.actionItem}
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
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionItem: {
    alignItems: "center",
    width: "22%",
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
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
    color: "#334155",
    textAlign: "center",
  },
});

