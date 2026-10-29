import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
import { StudentInfo } from "../types";

export interface HomeHeaderProps {
  student: StudentInfo;
  topPadding: number;
  onNavigate: (screen: string) => void;
}

export const HomeHeader = React.memo(function HomeHeader({
  student,
  topPadding,
  onNavigate,
}: HomeHeaderProps) {
  const { colors, isDark } = useTheme();

  const handleSosPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onNavigate("sos");
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNavigate("profile");
  };

  const isGuest = !student.mssv || student.mssv === "guest";
  const roleLabel = isGuest ? "Khách tham quan" : `Sinh viên • ${student.mssv}`;
  const displayName = student.ho_ten || student.fullName || (isGuest ? "Bạn mới" : "Sinh viên");

  const gradientColors: [string, string, ...string[]] = isDark
    ? ["#1E293B", "#0F172A"]
    : [colors.primary, "#1E40AF"];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingTop: topPadding,
        },
      ]}
    >
      {/* Vòng tròn hiệu ứng ánh sáng nền mờ cao cấp */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <View style={styles.row}>
        {/* Thông tin người dùng & Lời chào (Không bị che khuất khi tên dài) */}
        <View style={styles.userInfo}>
          <View style={styles.roleBadge}>
            <Feather
              name={isGuest ? "compass" : "award"}
              size={11.5}
              color="rgba(255, 255, 255, 0.95)"
            />
            <Text style={styles.userRole} numberOfLines={1}>
              {roleLabel}
            </Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.greetingText}>Xin chào 👋</Text>
            <Text
              style={styles.userName}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {displayName}
            </Text>
          </View>
        </View>

        {/* Các nút tác vụ nhanh */}
        <View style={styles.actions}>
          {/* Nút SOS khẩn cấp */}
          <Pressable
            onPress={handleSosPress}
            style={({ pressed }) => [
              styles.sosBtn,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Nút khẩn cấp SOS"
          >
            <Feather name="shield" size={17} color="#FFFFFF" />
            <View style={styles.sosPulseDot} />
          </Pressable>

          {/* Nút Hồ sơ / Avatar */}
          <Pressable
            onPress={handleProfilePress}
            style={({ pressed }) => [
              styles.profileBtn,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Hồ sơ cá nhân"
          >
            {student.avatar ? (
              <Image source={{ uri: student.avatar }} style={styles.avatar} />
            ) : (
              <Feather name="user" size={18} color="#FFFFFF" />
            )}
            <View style={styles.onlineDot} />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    overflow: "hidden",
  },
  ambientGlowTop: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -60,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    marginBottom: 5,
  },
  userRole: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  nameRow: {
    flexDirection: "column",
  },
  greetingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 19.5,
    fontWeight: "900",
    letterSpacing: -0.2,
    lineHeight: 25,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  aiBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  aiGlowDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
    borderWidth: 1.5,
    borderColor: "#065F46",
  },
  sosBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: AppColors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  sosPulseDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: AppColors.danger,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
