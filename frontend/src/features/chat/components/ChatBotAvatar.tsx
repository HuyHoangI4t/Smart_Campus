import React, { memo } from "react";
import { View, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ChatBotAvatarProps {
  size?: number;
  showOnlineDot?: boolean;
}

export const ChatBotAvatar = memo(function ChatBotAvatar({
  size = 36,
  showOnlineDot = true,
}: ChatBotAvatarProps) {
  const borderRadius = size / 2;
  const logoSize = Math.round(size * 0.82);
  const logoRadius = logoSize / 2;
  const dotSize = Math.max(Math.round(size * 0.24), 8);
  const dotRadius = dotSize / 2;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* Vòng hào quang gradient kính mờ AI (Specular Glow Ring) */}
      <LinearGradient
        colors={["#3B82F6", "#6366F1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.glowRing,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        {/* Lớp nền kính mờ bảo vệ */}
        <View
          style={[
            styles.innerGlass,
            {
              width: size - 3,
              height: size - 3,
              borderRadius: (size - 3) / 2,
            },
          ]}
        >
          {/* Logo đại học Tây Nguyên */}
          <Image
            source={require("../../../../assets/images/favicon.png")}
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: logoRadius,
            }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Viền phản quang Specular Highlight Rim */}
      <View
        style={[
          styles.specularRim,
          {
            borderRadius,
            borderWidth: size >= 60 ? 2 : 1.2,
          },
        ]}
      />

      {/* Đèn tín hiệu trạng thái AI trực tuyến (Online Glow Dot) */}
      {showOnlineDot && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: dotSize + 3,
              height: dotSize + 3,
              borderRadius: (dotSize + 3) / 2,
              bottom: size >= 60 ? 3 : -1,
              right: size >= 60 ? 3 : -1,
            },
          ]}
        >
          <View
            style={[
              styles.onlineDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotRadius,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    alignItems: "center",
    justifyContent: "center",
    padding: 1.5,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  innerGlass: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  specularRim: {
    ...StyleSheet.absoluteFillObject,
    borderColor: "rgba(255, 255, 255, 0.45)",
    pointerEvents: "none",
  },
  onlineBadge: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  onlineDot: {
    backgroundColor: "#10B981",
  },
});

