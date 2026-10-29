import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Linking
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../src/context/ThemeContext";
import { NavHeader } from "../../../src/components/NavHeader";
import { GlassView } from "../../../src/components/GlassView";
import { GlassTokens } from "../../../src/constants/glassStyles";
import {
  apiAskChatbot,
  apiGetChatSuggestions,
  ChatMessage,
  ChatSuggestion,
  ChatAction,
} from "../../../src/services/api/chatApi";
import {
  ChatMessageItem,
  ChatWelcomeView,
  ChatTypingDots,
  ChatInputBar,
  ChatBotAvatar,
  useStudentChatContext,
} from "../../../src/features/chat";

export default function ChatBotScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const studentContext = useStudentChatContext();

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    apiGetChatSuggestions().then(setSuggestions).catch(() => {});
  }, []);

  const handleExecuteAction = useCallback(
    (action?: ChatAction) => {
      if (!action || action.type === "NONE") return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      switch (action.type) {
        case "OPEN_MAP_3D":
          router.push({
            pathname: "/(main)/map",
            params: { room: action.target_id || "", t: Date.now().toString() },
          });
          break;
        case "OPEN_SCHEDULE":
          router.push("/(main)/schedule");
          break;
        case "OPEN_TUITION":
          router.push("/(main)/grades");
          break;
        case "CONTACT_SUPPORT":
          Linking.openURL(`tel:${action.target_id || "02623825185"}`).catch(() => {});
          break;
      }
    },
    [router]
  );

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputMessage).trim();
      if (!text || loading) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage("");
      setLoading(true);

      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await apiAskChatbot(text, history, studentContext);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          intent: response.intent,
          action: response.action,
          suggested_questions: response.suggested_questions,
          engine: response.engine,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: "Xin lÃ¡Â»âi bÃ¡ÂºÂ¡n, ÃâÃÂ£ xÃ¡ÂºÂ£y ra sÃ¡Â»Â± cÃ¡Â»â khi xÃ¡Â»Â­ lÃÂ½ cÃÂ¢u hÃ¡Â»Âi. Vui lÃÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau nhÃÂ©!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    },
    [inputMessage, loading, messages, studentContext]
  );

  const handleResetChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMessages([]);
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      {/* 2 quả cầu sáng phản chiếu nền kính mờ (Ambient Frosted Mesh Glow) */}
      <View
        style={[
          styles.ambientGlowTop,
          {
            backgroundColor: isDark ? "rgba(59, 130, 246, 0.16)" : "rgba(37, 99, 235, 0.08)",
          },
        ]}
      />
      <View
        style={[
          styles.ambientGlowBottom,
          {
            backgroundColor: isDark ? "rgba(139, 92, 246, 0.14)" : "rgba(99, 102, 241, 0.07)",
          },
        ]}
      />

      <NavHeader
        title="TTN Smart Bot"
        subtitle="Trợ lý AI • Vector RAG"
        showBack={true}
        onBack={() => router.back()}
        blur={true}
        rightElement={
          <TouchableOpacity
            onPress={handleResetChat}
            style={[
              styles.resetHeaderBtn,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)",
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Làm mới cuộc trò chuyện"
          >
            <Feather name="rotate-ccw" size={16} color={isDark ? "#FFFFFF" : colors.primary} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {hasMessages ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessageItem
                message={item}
                onExecuteAction={handleExecuteAction}
                onSelectPrompt={handleSendMessage}
              />
            )}
            contentContainerStyle={styles.chatListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              loading ? (
                <View style={styles.thinkingRow}>
                  <ChatBotAvatar size={34} />
                  <GlassView
                    style={[
                      styles.thinkingBubble,
                      {
                        backgroundColor: isDark ? "rgba(30, 41, 59, 0.78)" : "rgba(255, 255, 255, 0.88)",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.95)",
                      },
                    ]}
                    borderRadius={20}
                    borderWidth={1.2}
                  >
                    <ChatTypingDots color={colors.primary} />
                    <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                      Đang suy nghĩ...
                    </Text>
                  </GlassView>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={[1]}
            keyExtractor={() => "welcome"}
            renderItem={() => <ChatWelcomeView onSelectPrompt={handleSendMessage} />}
            contentContainerStyle={styles.welcomeScrollContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!hasMessages && suggestions.length > 0 && (
          <View style={styles.suggestionRow}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={suggestions}
              keyExtractor={(s) => s.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    handleSendMessage(item.text);
                  }}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.85)",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(19, 47, 115, 0.08)",
                    },
                  ]}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityLabel={item.text}
                >
                  <Feather
                    name={(item.icon as keyof typeof Feather.glyphMap) || "help-circle"}
                    size={12.5}
                    color={colors.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>{item.text}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <ChatInputBar
          value={inputMessage}
          onChangeText={setInputMessage}
          onSend={() => handleSendMessage()}
          disabled={loading}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  ambientGlowTop: {
    position: "absolute",
    top: 30,
    right: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    pointerEvents: "none",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: 80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    pointerEvents: "none",
  },
  resetHeaderBtn: {
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  welcomeScrollContent: {
    paddingBottom: 16,
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomLeftRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  thinkingText: {
    fontSize: 12.5,
    fontWeight: "600",
    fontStyle: "italic",
  },
  suggestionRow: {
    paddingVertical: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    borderRadius: GlassTokens.radii.pill,
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

