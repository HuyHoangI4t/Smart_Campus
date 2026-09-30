import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { clearAuthAndCache } from "../../../src/services/api";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Sinh Viên Mẫu");
  const [phone, setPhone] = useState("+84 123 456 789");
  const [notifs, setNotifs] = useState(true);
  const [campusAlerts, setCampusAlerts] = useState(true);

  const handleLogout = async () => {
    await clearAuthAndCache();
    router.replace("/(auth)");
  };

  const info = [
    { label: "Họ và Tên", value: name, editable: true, onChange: setName },
    { label: "Mã Sinh viên", value: "23103023", editable: false },
    { label: "Khoa", value: "Khoa KHTN&CN", editable: false },
    { label: "Khóa", value: "k23", editable: false },
    { label: "Email", value: "sinhvien@sv.ttn.edu.vn", editable: false },
    { label: "Số điện thoại", value: phone, editable: true, onChange: setPhone },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <LinearGradient
        colors={[AppColors.primary, AppColors.primary] as [string, string]}
        style={{ paddingHorizontal: 24, paddingTop: Math.max(insets.top + 16, 24), paddingBottom: 40 }}
      >
        <View style={[s.row, s.between]}>
          <TouchableOpacity onPress={() => router.push("/(main)/home")} style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18, flex: 1, marginLeft: 12 }}>Hồ sơ của tôi</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)} style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name="edit-3" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", marginTop: -32, marginBottom: 20 }}>
          <View style={{ position: "relative" }}>
            <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: AppColors.accent, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: AppColors.background, elevation: 8, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 30 }}>KA</Text>
            </View>
            {editing && (
              <TouchableOpacity style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: AppColors.primary, borderWidth: 2, borderColor: AppColors.background, alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: AppColors.textForeground, marginTop: 12 }}>{name}</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: AppColors.textMuted }}>23103023  • Khóa k23</Text>
        </View>

        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          <View style={[s.card, { padding: 0 }]}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border, backgroundColor: AppColors.muted + "80" }}>
              <Text style={{ fontSize: 11, fontWeight: "900", color: AppColors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Thông tin sinh viên</Text>
            </View>
            {info.map(({ label, value, editable, onChange }, i) => (
              <View key={label} style={[{ paddingHorizontal: 16, paddingVertical: 12 }, i < info.length - 1 && { borderBottomWidth: 1, borderBottomColor: AppColors.border }]}>
                <Text style={{ fontSize: 10, fontWeight: "900", color: AppColors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{label}</Text>
                {editing && editable ? (
                  <TextInput defaultValue={value} onChangeText={onChange} style={{ fontSize: 14, fontWeight: "600", color: AppColors.textForeground, borderBottomWidth: 1, borderBottomColor: AppColors.accent, paddingVertical: 2 }} />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: AppColors.textForeground }} numberOfLines={1}>{value}</Text>
                )}
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {[{ label: "Sự kiện tham gia", value: "12" }, { label: "Báo cáo đã gửi", value: "3" }, { label: "Nhóm học tập", value: "2" }].map(({ label, value }) => (
              <View key={label} style={[s.card, { flex: 1, alignItems: "center", padding: 12 }]}>
                <Text style={{ fontSize: 24, fontWeight: "900", color: AppColors.primary }}>{value}</Text>
                <Text style={{ fontSize: 9, fontWeight: "700", color: AppColors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={[s.card, { padding: 0 }]}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border, backgroundColor: AppColors.muted + "80" }}>
              <Text style={{ fontSize: 11, fontWeight: "900", color: AppColors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Cài đặt & Tùy chọn</Text>
            </View>
            {[
              { label: "Thông báo đẩy", icon: "bell", toggle: true, val: notifs, set: setNotifs },
              { label: "Cảnh báo từ trường", icon: "alert-triangle", toggle: true, val: campusAlerts, set: setCampusAlerts },
              { label: "Cài đặt quyền riêng tư", icon: "lock", chevron: true },
              { label: "Trợ giúp & Hỗ trợ", icon: "info", chevron: true, onPress: () => router.push("/(main)/feedback") },
            ].map(({ label, icon, toggle, val, set, chevron, onPress }, i) => (
              <TouchableOpacity key={label} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={[s.row, s.between, { paddingHorizontal: 16, paddingVertical: 14 }, i < 3 && { borderBottomWidth: 1, borderBottomColor: AppColors.border }]}>
                <View style={s.row}>
                  <Feather name={icon as any} size={16} color={AppColors.textMuted} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: AppColors.textForeground }}>{label}</Text>
                </View>
                {toggle && (
                  <TouchableOpacity onPress={() => set?.(!val)} style={{ width: 40, height: 20, borderRadius: 10, backgroundColor: val ? AppColors.accent : AppColors.muted, justifyContent: "center", paddingHorizontal: 2 }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff", alignSelf: val ? "flex-end" : "flex-start" }} />
                  </TouchableOpacity>
                )}
                {chevron && <Feather name="chevron-right" size={14} color={AppColors.textMuted} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleLogout} activeOpacity={0.85}
            style={[s.row, { justifyContent: "center", paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2", gap: 8 }]}>
            <Feather name="log-out" size={16} color="#DC2626" />
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#DC2626" }}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
