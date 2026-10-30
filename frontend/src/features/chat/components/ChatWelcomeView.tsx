import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { GlassView } from "../../../components/GlassView";
import { useTheme } from "../../../context/ThemeContext";
import { ChatBotAvatar } from "./ChatBotAvatar";
import { WelcomeCategory } from "../types";

export const WELCOME_CATEGORIES: WelcomeCategory[] = [
  {
    title: "Học tập & Đào tạo",
    icon: "book-open",
    questions: ["Lịch học hôm nay của mình", "Điểm GPA của mình thế nào", "Quy chế thang điểm 4"],
  },
  {
    title: "Khuôn viên & Bản đồ",
    icon: "map-pin",
    questions: ["Chỉ đường đến Nhà học số 9", "Thư viện ở đâu", "Mở bản đồ 3D"],
  },
  {
    title: "Chính sách & Hỗ trợ",
    icon: "award",
    questions: ["Tiêu chuẩn xét học bổng", "Quy định cảnh báo học vụ", "Hotline bảo vệ và y tế"],
  },
];

interface ChatWelcomeViewProps {
  onSelectPrompt: (text: string) => void;
}

export const ChatWelcomeView = memo(function ChatWelcomeView({ onSelectPrompt }: ChatWelcomeViewProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.welcomeContainer}>
      {/* Hero Avatar & Title */}
      <View style={styles.welcomeHero}>
        <View style={styles.heroAvatarContainer}>
          <ChatBotAvatar size={84} />
          {/* Vòng sáng AI phản xạ phía sau */}
          <View
            style={[
              styles.avatarHalo,
              {
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.25)" : "rgba(37, 99, 235, 0.15)",
              },
            ]}
          />
        </View>

        <Text style={[styles.welcomeTitle, { color: colors.text }]}>TTN Smart Bot</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Trợ lý AI chính thức của Đại học Tây Nguyên
        </Text>

        {/* Trạng thái AI kính mờ (Glass AI Badge) */}
        <GlassView
          style={styles.welcomeBadge}
          borderRadius={99}
          borderWidth={1}
          intensity={Platform.OS === "ios" ? 70 : 85}
        >
          <View style={styles.statusDotRow}>
            <View style={styles.onlinePulseOuter}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.welcomeBadgeText, { color: colors.success }]}>
              Trực tuyến • Vector RAG & Gemini AI
            </Text>
          </View>
        </GlassView>
      </View>

      {/* Bento Grid danh mục câu hỏi - Trong suốt không nền (No BG) */}
      <View style={styles.bentoGrid}>
        {WELCOME_CATEGORIES.map((cat, catIdx) => (
          <View
            key={catIdx}
            style={[
              styles.welcomeCategoryCard,
              {
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(37, 99, 235, 0.18)",
              },
            ]}
          >
            <View style={styles.categoryHeader}>
              <LinearGradient
                colors={isDark ? ["#1E3A8A", "#2563EB"] : ["#EEF2FF", "#E0E7FF"]}
                style={styles.categoryIconBox}
              >
                <Feather name={cat.icon} size={15} color={isDark ? "#FFFFFF" : colors.primary} />
              </LinearGradient>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>{cat.title}</Text>
            </View>

            <View style={styles.categoryQuestions}>
              {cat.questions.map((q, qIdx) => (
                <TouchableOpacity
                  key={qIdx}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    onSelectPrompt(q);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(19, 47, 115, 0.12)",
                    },
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={q}
                >
                  <Feather name="corner-down-right" size={12} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.categoryChipText, { color: colors.text }]} numberOfLines={1}>
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  welcomeContainer: {
    padding: 18,
    gap: 16,
  },
  welcomeHero: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  heroAvatarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarHalo: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    zIndex: -1,
  },
  welcomeTitle: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  welcomeBadge: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  onlinePulseOuter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  welcomeBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  bentoGrid: {
    gap: 12,
  },
  welcomeCategoryCard: {
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.2,
    backgroundColor: "transparent",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  categoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  categoryQuestions: {
    gap: 6.5,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
