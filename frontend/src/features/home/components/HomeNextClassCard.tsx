import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AppColors } from "../../../constants/appColors";
import { useTheme } from "../../../context/ThemeContext";
import { NextClassInfo } from "../types";

export interface HomeNextClassCardProps {
  nextClass: NextClassInfo | null;
  onPress: () => void;
}

/**
 * Thẻ Lớp học tiếp theo (NextClassCard) - Ngôn ngữ thiết kế Hybrid Android 16 & iOS HIG
 * Kết hợp hình khối Squircle bo lớn (22pt), thanh chỉ thị cạnh trái Pill Indicator,
 * viền siêu mỏng Hairline và phản hồi xúc giác co giãn lò xo (Springy Press).
 */
export const HomeNextClassCard = React.memo(function HomeNextClassCard({
  nextClass,
  onPress,
}: HomeNextClassCardProps) {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const indicatorColor = nextClass?.statusBadgeColor || AppColors.accentLight;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark ? colors.cardBg : colors.primary,
          borderColor: isDark ? colors.cardBorder : "rgba(255, 255, 255, 0.16)",
          shadowColor: isDark ? "#000000" : colors.primary,
        },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        nextClass
          ? `Lớp học tiếp theo: ${nextClass.subject}, tại phòng ${nextClass.room || "chưa rõ"}`
          : "Không có ca học nào"
      }
    >
      {/* ── THANH CHỈ THỊ TRẠNG THÁI (LEFT ACCENT PILL INDICATOR) ── */}
      <View
        style={[
          styles.leftPillIndicator,
          { backgroundColor: indicatorColor },
        ]}
      />

      <View style={styles.cardContent}>
        {/* Row 1: Status Pill Capsule + Tên phòng học */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.statusCapsule,
              { backgroundColor: `${indicatorColor}26`, borderColor: `${indicatorColor}4D` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: indicatorColor },
              ]}
            />
            <Text
              style={[
                styles.statusLabel,
                { color: indicatorColor },
              ]}
            >
              {nextClass ? (nextClass.statusLabel || "SẮP DIỄN RA") : "HÔM NAY TRỐNG"}
            </Text>
          </View>

          {nextClass?.room ? (
            <Text style={[styles.roomText, isDark && { color: colors.textSecondary }]}>
              Phòng: {nextClass.room}
            </Text>
          ) : (
            <Text style={[styles.roomText, isDark && { color: colors.textSecondary }]}>Đại học Tây Nguyên</Text>
          )}
        </View>

        {/* Row 2: Tên môn học + Pill thời gian */}
        <View style={styles.subjectRow}>
          <Text style={[styles.subjectText, isDark && { color: colors.text }]} numberOfLines={1}>
            {nextClass ? nextClass.subject : "Không có ca học nào"}
          </Text>

          {nextClass?.time ? (
            <View style={[styles.timeBadgePill, isDark && { backgroundColor: "#334155" }]}>
              <Text style={[styles.timeText, isDark && { color: colors.text }]}>{nextClass.time}</Text>
            </View>
          ) : null}
        </View>

        {/* Row 3: Giảng viên + Nút chỉ đường viên con nhộng */}
        <View style={styles.footerRow}>
          <View style={styles.lecturerRow}>
            <View style={[styles.lecturerIconCircle, isDark && { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather
                name={nextClass ? "user" : "coffee"}
                size={11.5}
                color={isDark ? colors.textSecondary : "#FFFFFF"}
              />
            </View>
            <Text style={[styles.lecturerText, isDark && { color: colors.textSecondary }]} numberOfLines={1}>
              {nextClass
                ? (nextClass.lecturer || "Chưa cập nhật GV")
                : "Tận hưởng ngày nghỉ hoặc ôn bài nhé!"}
            </Text>
          </View>

          <View style={[styles.directionCapsule, isDark && { backgroundColor: "rgba(91, 97, 244, 0.25)" }]}>
            <Text style={[styles.directionText, isDark && { color: colors.accentLight }]}>
              {nextClass ? "Chỉ đường" : "Xem lịch"}
            </Text>
            <Feather
              name={nextClass ? "navigation" : "calendar"}
              size={12}
              color={isDark ? colors.accentLight : AppColors.textLight}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.primary,
    borderRadius: 22, // Squircle bo lớn chuẩn Android 16 & iOS HIG
    marginBottom: 16, // Hệ số 8pt
    overflow: "hidden",
    position: "relative",
    borderWidth: 1, // Viền Hairline tinh tế
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.975 }], // Lực co giãn lò xo mượt mà
  },
  leftPillIndicator: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 4.5,
    borderRadius: 999, // Bo viên con nhộng
  },
  cardContent: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    paddingLeft: 22,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999, // Pill-shape capsule
    borderWidth: 0.8,
  },
  statusDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 999,
  },
  statusLabel: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  roomText: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  subjectText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  timeBadgePill: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 999, // Pill-shape
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lecturerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
    marginRight: 10,
  },
  lecturerIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  lecturerText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  directionCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999, // Pill-shape
    minHeight: 36,
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  directionText: {
    color: AppColors.textLight,
    fontSize: 12,
    fontWeight: "900",
  },
});

