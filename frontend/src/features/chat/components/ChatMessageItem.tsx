import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { GlassView } from "../../../components/GlassView";
import { useTheme } from "../../../context/ThemeContext";
import { parseBotMarkdown } from "../markdownUtils";
import { ChatBotAvatar } from "./ChatBotAvatar";
import { ChatMessage, ChatAction } from "../types";
import { messageStyles as styles } from "./chatMessage.styles";

const ACTION_MAP: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  OPEN_MAP_3D: { label: "Mở vị trí trên bản đồ", icon: "map-pin" },
  OPEN_SCHEDULE: { label: "Xem thời khóa biểu", icon: "calendar" },
  OPEN_GRADES: { label: "Xem bảng điểm & GPA", icon: "award" },
  OPEN_TUITION: { label: "Xem điểm & học phí", icon: "award" },
  OPEN_SOS: { label: "Mở cứu hộ khẩn cấp SOS", icon: "alert-triangle" },
  OPEN_FEEDBACK: { label: "Gửi ý kiến phản ánh", icon: "message-square" },
  OPEN_PROFILE: { label: "Xem hồ sơ sinh viên", icon: "user" },
  OPEN_SETTINGS: { label: "Mở cài đặt ứng dụng", icon: "settings" },
  OPEN_CHANGE_PASSWORD: { label: "Đổi mật khẩu tài khoản", icon: "lock" },
  OPEN_NEWS: { label: "Xem tin tức & thông báo", icon: "file-text" },
  CONTACT_SUPPORT: { label: "Gọi hotline hỗ trợ", icon: "phone-call" },
};

interface ChatMessageItemProps {
  message: ChatMessage;
  onExecuteAction: (action?: ChatAction) => void;
  onSelectPrompt: (text: string) => void;
}

export const ChatMessageItem = memo(function ChatMessageItem({
  message,
  onExecuteAction,
  onSelectPrompt,
}: ChatMessageItemProps) {
  const { colors, isDark } = useTheme();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View style={[styles.messageRow, styles.messageRowUser]}>
        <LinearGradient
          colors={isDark ? ["#1E3A8A", "#2563EB"] : [colors.primary, "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, styles.userBubble]}
        >
          <View style={styles.userBubbleRim} />
          <Text style={styles.userMessageText}>{message.content}</Text>
          <Text style={styles.userTimeText}>{message.timestamp}</Text>
        </LinearGradient>
      </View>
    );
  }

  let intentBg = isDark ? "rgba(59, 130, 246, 0.20)" : "rgba(37, 99, 235, 0.10)";
  let intentBorder = isDark ? "rgba(59, 130, 246, 0.40)" : "rgba(37, 99, 235, 0.25)";
  let intentText = colors.primaryLight || colors.primary;
  let intentIcon: keyof typeof Feather.glyphMap = "info";

  if (message.intent === "PERSONAL_GRADE") {
    intentBg = isDark ? "rgba(139, 92, 246, 0.22)" : "rgba(124, 58, 237, 0.10)";
    intentBorder = isDark ? "rgba(139, 92, 246, 0.45)" : "rgba(124, 58, 237, 0.25)";
    intentText = colors.purple;
    intentIcon = "award";
  } else if (message.intent === "CAMPUS_MAP") {
    intentBg = isDark ? "rgba(16, 185, 129, 0.22)" : "rgba(5, 150, 105, 0.10)";
    intentBorder = isDark ? "rgba(16, 185, 129, 0.45)" : "rgba(5, 150, 105, 0.25)";
    intentText = colors.success;
    intentIcon = "map-pin";
  } else if (message.intent === "PERSONAL_SCHEDULE") {
    intentBg = isDark ? "rgba(14, 165, 233, 0.22)" : "rgba(2, 132, 199, 0.10)";
    intentBorder = isDark ? "rgba(14, 165, 233, 0.45)" : "rgba(2, 132, 199, 0.25)";
    intentText = "#0284C7";
    intentIcon = "calendar";
  } else if (message.intent === "APP_FEATURE") {
    intentBg = isDark ? "rgba(16, 185, 129, 0.22)" : "rgba(16, 185, 129, 0.10)";
    intentBorder = isDark ? "rgba(16, 185, 129, 0.45)" : "rgba(16, 185, 129, 0.25)";
    intentText = colors.success;
    intentIcon = "grid";
  } else if (message.intent === "GENERAL_INFO") {
    intentBg = isDark ? "rgba(245, 158, 11, 0.22)" : "rgba(217, 119, 6, 0.10)";
    intentBorder = isDark ? "rgba(245, 158, 11, 0.45)" : "rgba(217, 119, 6, 0.25)";
    intentText = colors.warning;
    intentIcon = "file-text";
  }

  const actionInfo = message.action && message.action.type !== "NONE" ? ACTION_MAP[message.action.type] : null;

  return (
    <View style={[styles.messageRow, styles.messageRowBot]}>
      <ChatBotAvatar size={34} />

      <GlassView
        style={[
          styles.messageBubble,
          styles.botBubble,
          {
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.78)" : "rgba(255, 255, 255, 0.88)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.95)",
            shadowColor: isDark ? "#000" : "rgba(37, 99, 235, 0.10)",
            shadowOpacity: isDark ? 0.35 : 0.08,
            shadowRadius: 14,
            elevation: 3,
          },
        ]}
        borderRadius={22}
        borderWidth={1.2}
      >
        <View style={styles.botMetaHeader}>
          <View style={styles.botNameRow}>
            <Text style={[styles.botMetaName, { color: colors.primary }]}>TTN Smart Bot</Text>
            <View style={styles.aiSparkTag}>
              <Feather name="zap" size={9} color="#3B82F6" />
              <Text style={styles.aiSparkText}>AI</Text>
            </View>
          </View>

          {message.intent && (
            <View
              style={[
                styles.intentBadge,
                {
                  backgroundColor: intentBg,
                  borderColor: intentBorder,
                },
              ]}
            >
              <Feather name={intentIcon} size={9.5} color={intentText} style={{ marginRight: 3.5 }} />
              <Text style={[styles.intentText, { color: intentText }]}>{message.intent}</Text>
            </View>
          )}
        </View>

        <View style={styles.botContentContainer}>
          {parseBotMarkdown(message.content, colors.text, colors.primary)}
        </View>

        {actionInfo && message.action && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              onExecuteAction(message.action);
            }}
            activeOpacity={0.82}
            style={styles.actionBtnTouch}
            accessibilityRole="button"
            accessibilityLabel={actionInfo.label}
          >
            <LinearGradient
              colors={isDark ? ["#2563EB", "#4F46E5"] : [colors.primary, "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtn}
            >
              <View style={styles.actionBtnIconBox}>
                <Feather name={actionInfo.icon} size={13} color="#FFFFFF" />
              </View>
              <Text style={styles.actionBtnText}>
                {message.action.type === "OPEN_MAP_3D" && message.action.target_id
                  ? `${actionInfo.label} (${message.action.target_id})`
                  : actionInfo.label}
              </Text>
              <Feather name="arrow-right" size={13} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {message.suggested_questions && message.suggested_questions.length > 0 && (
          <View style={styles.dynamicSuggestionsBox}>
            {message.suggested_questions.map((q, qIdx) => (
              <TouchableOpacity
                key={qIdx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onSelectPrompt(q);
                }}
                style={[
                  styles.dynamicChip,
                  {
                    backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
                    borderColor: isDark ? "rgba(96, 165, 250, 0.35)" : "#BFDBFE",
                  },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Feather
                  name="corner-down-right"
                  size={12}
                  color={isDark ? "#93C5FD" : "#2563EB"}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.dynamicChipText, { color: isDark ? "#DBEAFE" : "#1D4ED8" }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.messageTime, { color: colors.textSubtle }]}>{message.timestamp}</Text>
      </GlassView>
    </View>
  );
});
