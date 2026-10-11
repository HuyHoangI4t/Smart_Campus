import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
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
  const handleSosPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onNavigate("sos");
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNavigate("profile");
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.userInfo}>
          <Text style={styles.userRole} numberOfLines={1}>
            {student.mssv && student.mssv !== "guest"
              ? `SINH VIÊN • ${student.mssv}`
              : "KHÁCH THAM QUAN"}
          </Text>
          <Text style={styles.userName} numberOfLines={1}>
            {student.ho_ten || student.fullName || "Sinh viên"}
          </Text>
        </View>

        <View style={styles.actions}>
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
            <Feather name="shield" size={18} color="#FFFFFF" />
          </Pressable>

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
              <Image
                source={{ uri: student.avatar }}
                style={styles.avatar}
              />
            ) : (
              <Feather name="user" size={19} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.primary,
    paddingBottom: 16,
    paddingHorizontal: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userRole: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  sosBtn: {
    width: 44, // Touch target tối thiểu 44pt
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  profileBtn: {
    width: 44, // Touch target tối thiểu 44pt
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
