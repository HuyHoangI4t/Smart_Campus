import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NextClassInfo } from "../types";

export interface HomeNextClassCardProps {
  nextClass: NextClassInfo | null;
  onPress: () => void;
}

export const HomeNextClassCard = React.memo(function HomeNextClassCard({
  nextClass,
  onPress,
}: HomeNextClassCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
    >
      {/* Row 1: dot + statusLabel + Phòng & giờ */}
      <View style={styles.rowBetween}>
        <View style={styles.statusBadgeRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: nextClass?.statusBadgeColor || "#A855F7" },
            ]}
          />
          <Text style={styles.statusLabel}>
            {nextClass?.statusLabel || "NGÀY MAI"}
          </Text>
        </View>
        <Text style={styles.roomText}>
          {nextClass
            ? `${nextClass.room ? `${nextClass.room} ` : ""}`
            : "Bản đồ trường"}
        </Text>
      </View>

      {/* Row 2: Tên môn học + Badge tiết */}
      <View style={[styles.rowBetween, { marginBottom: 10 }]}>
        <Text style={styles.subjectText} numberOfLines={1}>
          {nextClass?.subject || "Không có ca học nào trong ngày mai"}
        </Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>
            {nextClass ? (nextClass.time.startsWith("Tiết") ? nextClass.time : `Tiết ${nextClass.time}`) : "Nghỉ"}
          </Text>
        </View>
      </View>

      {/* Row 3: Giảng viên + Chỉ đường → */}
      <View style={styles.rowBetween}>
        <View style={styles.lecturerRow}>
          <Feather name="user" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.lecturerText} numberOfLines={1}>
            {nextClass?.lecturer ? nextClass.lecturer : (nextClass ? "Giảng viên bộ môn" : "Mở bản đồ trường")}
          </Text>
        </View>

        <View style={styles.directionBtn}>
          <Feather name="navigation" size={11.5} color="#93C5FD" />
          <Text style={styles.directionText}>Chỉ đường →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0F2964",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#0F2964",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
  },
  statusLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  roomText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11.5,
    fontWeight: "700",
  },
  subjectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    marginRight: 10,
  },
  timeBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  lecturerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  lecturerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  directionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  directionText: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
  },
});

