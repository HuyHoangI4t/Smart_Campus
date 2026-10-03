import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiSubmitSos, apiGetSosConfig } from "../../../src/services/api";

const DEFAULT_HOTLINES = [
  { label: "Bảo vệ & An ninh cơ sở (Huy Hoàng)", phone: "0329106783", icon: "shield" as const },
  { label: "Trạm Y tế sinh viên (Duyên)", phone: "0978269097", icon: "plus-circle" as const },
  { label: "Cấp cứu 115 (Xuân Hoàng)", phone: "0326896303", icon: "phone-call" as const },
  { label: "Cứu hỏa PCCC 114 (Kiên)", phone: "0968372005", icon: "alert-octagon" as const },
];

const DEFAULT_INCIDENT_TYPES = [
  "Cần hỗ trợ y tế",
  "Sự cố an ninh / va chạm",
  "Chập điện / Hỏa hoạn",
  "Kẹt thang máy",
  "Khác",
];

export default function SosScreen() {
  const router = useRouter();
  const [hotlines, setHotlines] = useState(DEFAULT_HOTLINES);
  const [incidentTypes, setIncidentTypes] = useState(DEFAULT_INCIDENT_TYPES);
  const [incidentType, setIncidentType] = useState("Cần hỗ trợ y tế");
  const [locationText, setLocationText] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiGetSosConfig();
        if (res && res.success) {
          if (res.hotlines && Array.isArray(res.hotlines)) {
            setHotlines(res.hotlines);
          }
          if (res.incidentTypes && Array.isArray(res.incidentTypes)) {
            setIncidentTypes(res.incidentTypes);
          }
        }
      } catch {}
    };
    fetchConfig();
  }, []);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Lỗi", `Không thể mở trình gọi điện thoại cho số ${phone}.`);
    });
  };

  const handleSendSos = async () => {
    if (!locationText.trim()) {
      Alert.alert("Chú ý", "Vui lòng nhập vị trí hiện tại của bạn để đội an ninh tiếp cận nhanh nhất.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiSubmitSos({
        incidentType,
        location: locationText.trim(),
        description: notes.trim() || incidentType,
      });

      if (res && res.success) {
        Alert.alert(
          "ĐÃ GỬI BÁO ĐỘNG SOS",
          "Tín hiệu khẩn cấp đã được truyền đến Đội An ninh & Y tế khuôn viên trường. Vui lòng giữ bình tĩnh tại chỗ.",
          [{ text: "Đã hiểu", onPress: () => router.push("/(main)/home") }]
        );
      } else {
        Alert.alert("Thông báo", res?.message || "Không thể gửi tín hiệu lúc này. Vui lòng gọi trực tiếp hotline bên dưới!");
      }
    } catch {
      Alert.alert("Lỗi kết nối", "Vui lòng gọi trực tiếp cho số Hotline Bảo vệ để được trợ giúp tức thì.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Trợ giúp khẩn cấp SOS"
        subtitle="Hệ thống báo động an ninh & y tế học đường"
        showBack={true}
        onBack={() => router.push("/(main)/home")}
        backgroundColor="#DC2626"
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        {/* Panic Button Banner */}
        <View
          style={{
            padding: 20,
            borderRadius: 20,
            backgroundColor: "#FEF2F2",
            borderWidth: 2,
            borderColor: "#FECACA",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#DC2626",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              shadowColor: "#DC2626",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Feather name="alert-triangle" size={36} color="#FFFFFF" />
          </View>

          <Text style={{ fontSize: 18, fontWeight: "900", color: "#DC2626", textAlign: "center" }}>
            BÁO ĐỘNG KHẨN CẤP
          </Text>
          <Text style={{ fontSize: 13, color: AppColors.textSecondary, textAlign: "center", marginTop: 4, paddingHorizontal: 10 }}>
            Chỉ sử dụng khi bạn hoặc người xung quanh gặp tình huống nguy hiểm về sức khỏe hoặc an ninh.
          </Text>
        </View>

        {/* Loại sự cố */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 8 }}>
          Loại sự cố khẩn cấp
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {incidentTypes.map((type) => {
            const isSelected = type === incidentType;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setIncidentType(type)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  backgroundColor: isSelected ? "#DC2626" : AppColors.cardBg,
                  borderWidth: 1,
                  borderColor: isSelected ? "#DC2626" : AppColors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : AppColors.text }}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vị trí */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 6 }}>
          Vị trí hiện tại của bạn <Text style={{ color: "#DC2626" }}>*</Text>
        </Text>
        <TextInput
          placeholder="Ví dụ: Tầng 3 Tòa B, trước cửa phòng B302..."
          placeholderTextColor={AppColors.textMuted}
          value={locationText}
          onChangeText={setLocationText}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            paddingHorizontal: 14,
            fontSize: 14,
            color: AppColors.text,
            marginBottom: 14,
          }}
        />

        {/* Mô tả bổ sung */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 6 }}>
          Ghi chú thêm tình huống (tùy chọn)
        </Text>
        <TextInput
          placeholder="Mô tả số người liên quan hoặc tình trạng sơ bộ..."
          placeholderTextColor={AppColors.textMuted}
          value={notes}
          onChangeText={setNotes}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            paddingHorizontal: 14,
            fontSize: 14,
            color: AppColors.text,
            marginBottom: 20,
          }}
        />

        {/* Nút gửi SOS */}
        <TouchableOpacity
          onPress={handleSendSos}
          disabled={submitting}
          activeOpacity={0.8}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: "#DC2626",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 30,
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="radio" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5 }}>
                PHÁT TÍN HIỆU SOS NGAY
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Hotline liên hệ trực tiếp */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: AppColors.text, marginBottom: 12 }}>
          Đường dây nóng hỗ trợ trực tiếp
        </Text>
        <View style={{ gap: 10 }}>
          {hotlines.map((h) => (
            <TouchableOpacity
              key={h.phone}
              onPress={() => handleCall(h.phone)}
              activeOpacity={0.7}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: AppColors.cardBg,
                borderWidth: 1,
                borderColor: AppColors.cardBorder,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={[s.row, { gap: 12 }]}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "#FEF2F2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={h.icon} size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: AppColors.text }}>{h.label}</Text>
                  <Text style={{ fontSize: 13, color: AppColors.primary, fontWeight: "800", marginTop: 2 }}>{h.phone}</Text>
                </View>
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: "#ECFDF5",
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#059669" }}>Gọi ngay</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

