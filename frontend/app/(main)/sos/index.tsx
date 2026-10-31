import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking, ActivityIndicator, Modal, BackHandler } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { useTheme } from "../../../src/context/ThemeContext";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiSubmitSos, apiGetSosConfig } from "../../../src/services/api";
import { initSocket, onSosStatusChanged, DEVICE_CLIENT_ID, markSosAsSelfSent } from "../../../src/services/socketService";

const DEFAULT_HOTLINES = [
  { label: "Bảo vệ & An ninh cơ sở", phone: "0329106783", icon: "shield" as const },
  { label: "Trạm Y tế sinh viên", phone: "0978269097", icon: "plus-circle" as const },
  { label: "Cấp cứu 115", phone: "0326896303", icon: "phone-call" as const },
  { label: "Cứu hỏa PCCC 114", phone: "0968372005", icon: "alert-octagon" as const },
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
  const { colors, isDark } = useTheme();
  const [hotlines, setHotlines] = useState(DEFAULT_HOTLINES);
  const [incidentTypes, setIncidentTypes] = useState(DEFAULT_INCIDENT_TYPES);
  const [incidentType, setIncidentType] = useState("Cần hỗ trợ y tế");
  const [locationText, setLocationText] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Popup Modal Đã gửi SOS
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sentInfo, setSentInfo] = useState({ type: '', location: '', time: '' });

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

    initSocket();
    const unsub = onSosStatusChanged((data) => {
      const isResolved =
        data.status === "Đã xử lý" ||
        data.status === "Đã giải quyết" ||
        data.status?.toLowerCase().includes("đã xử lý");
      if (isResolved) {
        Alert.alert(
          "Cứu hộ an toàn",
          "Tín hiệu SOS của bạn đã được Đội Bảo vệ & Trực ban an ninh trường xử lý an toàn.",
          [{ text: "Đã hiểu" }]
        );
      }
    });

    return () => {
      unsub();
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      // 1. Tự động yêu cầu quyền vị trí và theo dõi GPS khi vào trang SOS
      const startGps = async () => {
        try {
          setIsLocating(true);
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (isCancelled || status !== 'granted') {
            if (!isCancelled) setIsLocating(false);
            return;
          }

          // Lấy nhanh tọa độ gần nhất
          try {
            const lastLoc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
            if (!isCancelled && lastLoc?.coords) {
              setGpsCoords({
                latitude: lastLoc.coords.latitude,
                longitude: lastLoc.coords.longitude,
              });
              AsyncStorage.setItem("@last_known_gps", JSON.stringify({ latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude })).catch(() => {});
            }
          } catch {}

          if (isCancelled) return;

          // Theo dõi liên tục vị trí thời gian thực khi đang ở màn hình SOS
          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 3,
              timeInterval: 2000,
            },
            (loc) => {
              if (isCancelled || !loc?.coords) return;
              setGpsCoords({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
              AsyncStorage.setItem("@last_known_gps", JSON.stringify({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })).catch(() => {});
            }
          );

          if (isCancelled) {
            sub.remove();
            return;
          }

          locationSubRef.current = sub;
        } catch (e) {
          console.warn('Lỗi định vị GPS SOS:', e);
        } finally {
          if (!isCancelled) {
            setIsLocating(false);
          }
        }
      };

      startGps();

      const onBackPress = () => {
        router.replace("/(main)/home");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      // KHI RỜI KHỎI TRANG SOS: TỰ ĐỘNG TẮT GPS VÀ DỌN DẸP SUBSCRIPTION
      return () => {
        isCancelled = true;
        sub.remove();
        setIsLocating(false);
        if (locationSubRef.current) {
          locationSubRef.current.remove();
          locationSubRef.current = null;
        }
      };
    }, [router])
  );

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Lỗi", `Không thể mở trình gọi điện thoại cho số ${phone}.`);
    });
  };

  const handleSendSos = async () => {
    if (!locationText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert("Chú ý", "Vui lòng nhập vị trí hiện tại của bạn để đội an ninh tiếp cận nhanh nhất.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setSubmitting(true);
    try {
      let currentCoords = gpsCoords;
      if (!currentCoords) {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc?.coords) {
            currentCoords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setGpsCoords(currentCoords);
          }
        } catch {}
      }

      const res = await apiSubmitSos({
        incidentType,
        location: locationText.trim(),
        description: notes.trim() || incidentType,
        latitude: currentCoords?.latitude,
        longitude: currentCoords?.longitude,
        client_id: DEVICE_CLIENT_ID,
      });

      if (res?.alert?.id) {
        markSosAsSelfSent(res.alert.id);
      }

      if (res && res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setSentInfo({
          type: incidentType,
          location: locationText.trim(),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });
        setShowSuccessModal(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Alert.alert("Thông báo", res?.message || "Không thể gửi tín hiệu lúc này. Vui lòng gọi trực tiếp hotline bên dưới!");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Lỗi kết nối", "Vui lòng gọi trực tiếp cho số Hotline Bảo vệ để được trợ giúp tức thì.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "#FEF2F2",
            borderWidth: 2,
            borderColor: isDark ? "rgba(220, 38, 38, 0.35)" : "#FECACA",
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
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", marginTop: 4, paddingHorizontal: 10 }}>
            Chỉ sử dụng khi bạn hoặc người xung quanh gặp tình huống nguy hiểm về sức khỏe hoặc an ninh.
          </Text>
        </View>

        {/* Loại sự cố */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
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
                  backgroundColor: isSelected ? "#DC2626" : colors.cardBg,
                  borderWidth: 1,
                  borderColor: isSelected ? "#DC2626" : colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : colors.text }}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vị trí */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          Vị trí hiện tại của bạn <Text style={{ color: "#DC2626" }}>*</Text>
        </Text>
        <TextInput
          placeholder="Ví dụ: Tầng 3 Nhà 7, trước cửa phòng 7.3.18..."
          placeholderTextColor={colors.textMuted}
          value={locationText}
          onChangeText={setLocationText}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: isDark ? "#0F172A" : colors.cardBg,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 14,
            fontSize: 14,
            color: colors.text,
            marginBottom: gpsCoords || isLocating ? 6 : 14,
          }}
        />

        {gpsCoords ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Feather name="navigation" size={12} color="#16A34A" />
            <Text style={{ fontSize: 11, color: isDark ? "#34D399" : "#16A34A", fontWeight: "700" }}>
              Đã định vị GPS: ({gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)})
            </Text>
          </View>
        ) : isLocating ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <ActivityIndicator size="small" color="#DC2626" />
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Đang lấy tọa độ GPS của bạn...</Text>
          </View>
        ) : null}

        {/* Mô tả bổ sung */}
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          Ghi chú thêm tình huống (tùy chọn)
        </Text>
        <TextInput
          placeholder="Mô tả số người liên quan hoặc tình trạng sơ bộ..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: isDark ? "#0F172A" : colors.cardBg,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 14,
            fontSize: 14,
            color: colors.text,
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
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 12 }}>
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
                backgroundColor: colors.cardBg,
                borderWidth: 1,
                borderColor: colors.cardBorder,
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
                    backgroundColor: isDark ? "rgba(220, 38, 38, 0.18)" : "#FEF2F2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={h.icon} size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{h.label}</Text>
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "800", marginTop: 2 }}>{h.phone}</Text>
                </View>
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: isDark ? "rgba(16, 185, 129, 0.18)" : "#ECFDF5",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : "#A7F3D0",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: isDark ? "#34D399" : "#059669" }}>Gọi ngay</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* POPUP MODAL ĐÃ GỬI SOS THÀNH CÔNG */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.push("/(main)/home");
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: colors.cardBg,
              borderRadius: 24,
              padding: 24,
              alignItems: "center",
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Pulsing Emergency Icon Badge */}
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: isDark ? "rgba(220, 38, 38, 0.18)" : "#FEF2F2",
                borderWidth: 5,
                borderColor: isDark ? "rgba(220, 38, 38, 0.3)" : "#FEE2E2",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="check" size={28} color="#FFFFFF" />
              </View>
            </View>

            {/* Tiêu đề Popup */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: "#DC2626",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              ĐÃ GỬI BÁO ĐỘNG SOS
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              Tín hiệu cứu hộ khẩn cấp đã được truyền trực tiếp đến Trung tâm Trực ban & Đội Bảo vệ trường.
            </Text>

            {/* Chi tiết thông tin đã gửi */}
            <View
              style={{
                width: "100%",
                backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                borderRadius: 16,
                padding: 14,
                marginTop: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary }}>Sự cố:</Text>
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#DC2626" }}>{sentInfo.type}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary }}>Vị trí:</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.text,
                    flex: 1,
                    textAlign: "right",
                    marginLeft: 8,
                  }}
                  numberOfLines={2}
                >
                  {sentInfo.location}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary }}>Thời gian:</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{sentInfo.time}</Text>
              </View>
            </View>

            {/* Dặn dò an toàn */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
                borderWidth: 1,
                borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A",
                borderRadius: 12,
                padding: 10,
                marginTop: 12,
                width: "100%",
              }}
            >
              <Feather name="alert-circle" size={16} color={isDark ? "#FBBF24" : "#D97706"} />
              <Text style={{ fontSize: 11, color: isDark ? "#FBBF24" : "#B45309", fontWeight: "600", flex: 1, lineHeight: 15 }}>
                Vui lòng giữ bình tĩnh, ở nguyên vị trí an toàn. Lực lượng cứu hộ đang tiếp cận!
              </Text>
            </View>

            {/* Hai nút hành động */}
            <View style={{ width: "100%", marginTop: 18, gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleCall("0329106783")}
                activeOpacity={0.8}
                style={{
                  height: 48,
                  backgroundColor: "#DC2626",
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Feather name="phone-call" size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                  Gọi ngay Bảo vệ cơ sở
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push("/(main)/home");
                }}
                activeOpacity={0.8}
                style={{
                  height: 44,
                  backgroundColor: isDark ? "#334155" : "#F1F5F9",
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: isDark ? "#F8FAFC" : "#475569" }}>
                  Đã hiểu & Về trang chủ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

