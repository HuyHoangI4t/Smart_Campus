import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";

const SCHEDULE = [
  { id: 1, course: "Cấu trúc dữ liệu & Giải thuật", code: "CS301", room: "ENG-B204", time: "08:00 – 09:30", day: "Mon", status: "upcoming", lecturer: "Dr. Amara Osei" },
  { id: 2, course: "Giải tích III", code: "MTH302", room: "SCI-A101", time: "10:00 – 11:30", day: "Mon", status: "live", lecturer: "Prof. Kofi Mensah" },
  { id: 3, course: "Viết kỹ thuật", code: "ENG201", room: "HUM-C302", time: "12:00 – 13:30", day: "Mon", status: "changed", lecturer: "Ms. Efua Darko" },
  { id: 4, course: "Mạng máy tính", code: "CS405", room: "IT-Lab 3", time: "14:00 – 15:30", day: "Mon", status: "upcoming", lecturer: "Dr. Samuel Agyei" },
  { id: 5, course: "Công nghệ phần mềm", code: "CS410", room: "ENG-B301", time: "08:00 – 09:30", day: "Tue", status: "upcoming", lecturer: "Prof. Linda Asante" },
  { id: 6, course: "Hệ quản trị CSDL", code: "CS350", room: "IT-Lab 1", time: "10:00 – 11:30", day: "Tue", status: "upcoming", lecturer: "Dr. James Kwarteng" },
];

function Card({ style, children }: { style?: object; children: React.ReactNode }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function NavHeader({
  title, subtitle, onBack, rightIcon, onRight, bg = AppColors.primary, children,
}: {
  title: string; subtitle?: string; onBack?: () => void;
  rightIcon?: string; onRight?: () => void; bg?: string; children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: Math.max(insets.top + 16, 20), paddingBottom: 20, backgroundColor: bg }}>
      <View style={[s.row, { gap: 12, marginBottom: children ? 16 : 0 }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>{title}</Text>
          {subtitle ? <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
        {rightIcon && (
          <TouchableOpacity onPress={onRight} style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name={rightIcon as any} size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

export default function ScheduleScreen() {
  const router = useRouter();
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];
  const dayCodes = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const [activeDay, setActiveDay] = useState("Mon");
  const dayClasses = SCHEDULE.filter((c) => c.day === activeDay);

  const STATUS: Record<string, { bg: string; text: string; border: string; label: string }> = {
    live: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", label: "● Đang diễn ra" },
    upcoming: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "Sắp tới" },
    changed: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", label: "Đổi phòng" },
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader title="Lịch học" subtitle="Học kỳ 1 • 2024/2025" onBack={() => router.push("/(main)/home")}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {days.map((d, i) => (
            <TouchableOpacity key={d} onPress={() => setActiveDay(dayCodes[i])}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center", backgroundColor: activeDay === dayCodes[i] ? "#fff" : "rgba(255,255,255,0.15)" }}>
              <Text style={{ fontSize: 12, fontWeight: "900", color: activeDay === dayCodes[i] ? AppColors.primary : "rgba(255,255,255,0.7)" }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </NavHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {dayClasses.length === 0 && (
          <View style={{ alignItems: "center", justifyContent: "center", height: 160 }}>
            <Feather name="calendar" size={32} color={AppColors.textMuted} />
            <Text style={{ fontWeight: "700", color: AppColors.textMuted, fontSize: 14, marginTop: 12 }}>Không có lịch học</Text>
          </View>
        )}
        {dayClasses.map((cls) => {
          const ss = STATUS[cls.status];
          return (
            <Card key={cls.id} style={cls.status === "changed" ? { borderColor: "#FDE68A" } : {}}>
              <View style={{ marginBottom: 8 }}>
                <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1, backgroundColor: ss.bg, borderColor: ss.border }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: ss.text }}>{ss.label}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "900", color: AppColors.textForeground, marginBottom: 2 }}>{cls.course}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textMuted, marginBottom: 12 }}>{cls.code}</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={s.row}><Feather name="clock" size={12} color={AppColors.textMuted} /><Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textForeground, marginLeft: 4 }}>{cls.time}</Text></View>
                <View style={s.row}><Feather name="map-pin" size={12} color={AppColors.textMuted} /><Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textForeground, marginLeft: 4 }}>{cls.room}</Text></View>
              </View>
              {cls.status === "changed" && (
                <View style={[s.row, { marginTop: 12, backgroundColor: "#FFFBEB", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#FDE68A" }]}>
                  <Feather name="alert-triangle" size={12} color="#D97706" />
                  <Text style={{ fontSize: 10, color: "#92400E", fontWeight: "600", marginLeft: 8 }}>Phòng đã thay đổi — hãy đến vị trí mới</Text>
                </View>
              )}
              <View style={[s.row, { marginTop: 12 }]}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(30,58,138,0.1)", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                  <Feather name="user" size={10} color={AppColors.primary} />
                </View>
                <Text style={{ fontSize: 12, color: AppColors.textMuted }}>{cls.lecturer}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
