import React, { memo } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "../../../components/GlassView";
import { useTheme } from "../../../context/ThemeContext";

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ChatInputBar = memo(function ChatInputBar({
  value,
  onChangeText,
  onSend,
  disabled = false,
  onFocus,
  onBlur,
}: ChatInputBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const canSend = value.trim().length > 0 && !disabled;
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  // Giữ lại bottom inset lớn nhất của thanh điều hướng (Android gesture pill / nav bar)
  // để tránh việc insets.bottom bị reset về 0 sau khi đóng bàn phím trên Android MIUI/HyperOS
  const cachedBottomInset = React.useRef(insets.bottom);
  if (insets.bottom > cachedBottomInset.current) {
    cachedBottomInset.current = insets.bottom;
  }
  const effectiveBottomInset = Math.max(cachedBottomInset.current, insets.bottom, 14);

  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSendPress = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSend();
  };

  return (
    <GlassView
      style={[
        styles.inputContainer,
        {
          paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 16),
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.88)" : "rgba(255, 255, 255, 0.90)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.95)",
        },
      ]}
      borderRadius={0}
      borderWidth={0}
      elevation={0}
      intensity={Platform.OS === "ios" ? 85 : 95}
    >
      <View style={styles.inputRow}>
        {/* Khung nhập liệu kính mờ (Frosted Glass Input Box) */}
        <View
          style={[
            styles.textInputWrapper,
            {
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.65)" : "rgba(241, 245, 249, 0.78)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(19, 47, 115, 0.10)",
            },
          ]}
        >
          <TextInput
            placeholder="Hỏi về lịch học, điểm số, đường đi..."
            placeholderTextColor={colors.textSubtle}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => {
              setKeyboardVisible(true);
              onFocus?.();
            }}
            onBlur={() => {
              setKeyboardVisible(false);
              onBlur?.();
            }}
            style={[styles.textInput, { color: colors.text }]}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSendPress}
            accessibilityLabel="Nhập câu hỏi"
          />
        </View>

        {/* Nút gửi Gradient kính mờ với hiệu ứng phát sáng */}
        <TouchableOpacity
          onPress={handleSendPress}
          disabled={!canSend}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Gửi tin nhắn"
          style={styles.sendButtonTouch}
        >
          <LinearGradient
            colors={
              canSend
                ? isDark
                  ? ["#3B82F6", "#6366F1"]
                  : [colors.primary, "#2563EB"]
                : isDark
                ? ["#1E293B", "#1E293B"]
                : ["#E2E8F0", "#E2E8F0"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.sendButton,
              canSend && styles.sendButtonActive,
            ]}
          >
            <Feather
              name="send"
              size={17}
              color={canSend ? "#FFFFFF" : isDark ? "#64748B" : "#94A3B8"}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </GlassView>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
  },
  textInputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  textInput: {
    fontSize: 14,
    maxHeight: 90,
    paddingVertical: 11,
    lineHeight: 20,
  },
  sendButtonTouch: {
    borderRadius: 23,
    marginBottom: 1,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
});
