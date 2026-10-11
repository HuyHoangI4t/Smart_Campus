import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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
          <TouchableOpacity
            onPress={() => onNavigate("sos")}
            activeOpacity={0.8}
            style={styles.sosBtn}
          >
            <Feather name="shield" size={17} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onNavigate("profile")}
            activeOpacity={0.8}
            style={styles.profileBtn}
          >
            {student.avatar ? (
              <Image
                source={{ uri: student.avatar }}
                style={styles.avatar}
              />
            ) : (
              <Feather name="user" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F2964",
    paddingBottom: 14,
    paddingHorizontal: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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
  sosBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});

