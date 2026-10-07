import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../constants/appColors";

interface LoginRequiredCardProps {
  mode?: "card" | "fullscreen";
  title?: string;
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
  onLoginPress?: () => void;
}

export const LoginRequiredCard: React.FC<LoginRequiredCardProps> = ({
  mode = "card",
  title = "Vui lòng đăng nhập để xem",
  message = "Đăng nhập tài khoản sinh viên Trường Đại học Tây Nguyên để truy cập đầy đủ tính năng.",
  icon = "lock",
  onLoginPress,
}) => {
  const router = useRouter();

  const handleLogin = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      router.push("/(auth)");
    }
  };

  if (mode === "fullscreen") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
          backgroundColor: AppColors.background,
        }}
      >
        {/* Vòng tròn biểu tượng kép có khóa */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: "#EFF6FF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            borderWidth: 2,
            borderColor: "#DBEAFE",
            position: "relative",
          }}
        >
          <Feather name={icon} size={38} color={AppColors.primary} />
          <View
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: AppColors.primary,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2.5,
              borderColor: "#FFFFFF",
            }}
          >
            <Feather name="lock" size={15} color="#FFFFFF" />
          </View>
        </View>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "900",
            color: "#0F172A",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            fontSize: 13.5,
            color: "#64748B",
            textAlign: "center",
            lineHeight: 20,
            marginBottom: 24,
            maxWidth: 300,
          }}
        >
          {message}
        </Text>

        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: AppColors.primary,
            paddingVertical: 13,
            paddingHorizontal: 28,
            borderRadius: 24,
            shadowColor: AppColors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Feather name="log-in" size={17} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
            Đăng nhập ngay
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Chế độ thẻ (card mode trong danh sách)
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        marginVertical: 4,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#F1F5F9",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          position: "relative",
        }}
      >
        <Feather name={icon} size={24} color={AppColors.primary} />
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#EF4444",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#FFFFFF",
          }}
        >
          <Feather name="lock" size={10} color="#FFFFFF" />
        </View>
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: "800",
          color: "#0F172A",
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 12.5,
          color: "#64748B",
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 16,
          paddingHorizontal: 8,
        }}
      >
        {message}
      </Text>

      <TouchableOpacity
        onPress={handleLogin}
        activeOpacity={0.85}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: AppColors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 20,
          shadowColor: AppColors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Feather name="log-in" size={15} color="#FFFFFF" />
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
          Đăng nhập ngay
        </Text>
      </TouchableOpacity>
    </View>
  );
};

