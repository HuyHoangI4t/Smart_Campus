import React, { useState, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";

export interface SosAlertData {
  id?: number | string;
  client_id?: string;
  mssv?: string;
  ho_ten?: string;
  so_dien_thoai?: string;
  lop?: string;
  location?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  message?: string;
  incidentType?: string;
  timestamp?: string | Date;
  distance?: number | null;
}

// Bộ lắng nghe sự kiện toàn cục hiển thị Modal SOS
type SosModalListener = (data: SosAlertData | null) => void;
const sosListeners = new Set<SosModalListener>();
let currentActiveAlert: SosAlertData | null = null;

export function showSosAlertModal(data: SosAlertData) {
  currentActiveAlert = data;
  sosListeners.forEach((cb) => {
    try {
      cb(data);
    } catch {}
  });
}

export function hideSosAlertModal() {
  currentActiveAlert = null;
  sosListeners.forEach((cb) => {
    try {
      cb(null);
    } catch {}
  });
}

export const SosAlertModal = memo(function SosAlertModal() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [alertData, setAlertData] = useState<SosAlertData | null>(currentActiveAlert);

  // Hiệu ứng đèn còi cứu hộ nhấp nháy liên tục (Beacon pulse)
  const beaconScale = useRef(new Animated.Value(1)).current;
  const beaconOpacity = useRef(new Animated.Value(0.7)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listener = (data: SosAlertData | null) => {
      setAlertData(data);
      if (data) {
        // Rung cảnh báo khẩn cấp
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

        modalScale.setValue(0.9);
        modalOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(modalScale, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    sosListeners.add(listener);
    return () => {
      sosListeners.delete(listener);
    };
  }, [modalScale, modalOpacity]);

  useEffect(() => {
    if (!alertData) return;

    const pulseAnim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(beaconScale, {
            toValue: 1.45,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(beaconScale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(beaconOpacity, {
            toValue: 0.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(beaconOpacity, {
            toValue: 0.75,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnim.start();
    return () => pulseAnim.stop();
  }, [alertData, beaconScale, beaconOpacity]);

  if (!alertData) return null;

  const handleCallSecurity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Linking.openURL("tel:0329106783").catch(() => {});
  };

  const handleOpenMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    hideSosAlertModal();
    router.push({
      pathname: "/(main)/map",
      params: {
        room: alertData.location || "",
        lat: alertData.latitude ? String(alertData.latitude) : "",
        lng: alertData.longitude ? String(alertData.longitude) : "",
        t: Date.now().toString(),
      },
    });
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    hideSosAlertModal();
  };

  const distanceText =
    alertData.distance !== undefined && alertData.distance !== null
      ? `cách bạn ~${Math.round(alertData.distance)}m`
      : "khuôn viên trường";

  const studentName = alertData.ho_ten || (alertData.mssv ? `MSSV ${alertData.mssv}` : "Sinh viên");
  const incidentTitle = alertData.incidentType || "Tín hiệu cứu hộ";

  return (
    <Modal
      visible={!!alertData}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
              borderColor: isDark ? "rgba(239, 68, 68, 0.45)" : "rgba(220, 38, 38, 0.35)",
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            },
          ]}
        >
          {/* Dải sáng đỏ phía trên Modal */}
          <LinearGradient
            colors={["#DC2626", "#EF4444", "#B91C1C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topAccentBar}
          />

          <View style={styles.modalContent}>
            {/* Vòng tròn còi cứu hộ SOS nhấp nháy phát sáng */}
            <View style={styles.beaconWrapper}>
              <Animated.View
                style={[
                  styles.beaconPulseHalo,
                  {
                    transform: [{ scale: beaconScale }],
                    opacity: beaconOpacity,
                  },
                ]}
              />
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.beaconCenter}
              >
                <Feather name="alert-octagon" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Tiêu đề & Nhãn khẩn cấp */}
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeText}>BÁO ĐỘNG SOS REALTIME</Text>
            </View>

            <Text style={[styles.mainHeading, { color: colors.text }]}>
              {incidentTitle}
            </Text>
            <Text style={[styles.subHeading, { color: isDark ? "#F87171" : "#DC2626" }]}>
              Phát hiện tín hiệu cầu trợ cứu hộ khẩn cấp!
            </Text>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Thẻ thông tin địa điểm & Khoảng cách */}
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: isDark ? "rgba(30, 41, 59, 0.7)" : "#FEF2F2",
                    borderColor: isDark ? "rgba(239, 68, 68, 0.25)" : "#FCA5A5",
                  },
                ]}
              >
                <View style={styles.infoRow}>
                  <View style={[styles.iconPill, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                    <Feather name="map-pin" size={16} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>VỊ TRÍ PHÁT TÍN HIỆU</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                      {alertData.location || "Trong khuôn viên Đại học Tây Nguyên"}
                    </Text>
                    <View style={styles.distanceBadge}>
                      <Feather name="navigation" size={11} color="#DC2626" />
                      <Text style={styles.distanceBadgeText}>{distanceText}</Text>
                    </View>
                  </View>
                </View>

                {/* Người phát tín hiệu */}
                <View style={[styles.infoRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
                  <View style={[styles.iconPill, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF" }]}>
                    <Feather name="user" size={15} color={isDark ? "#60A5FA" : "#2563EB"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>NGƯỜI GỬI CỨU TRỢ</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {studentName} {alertData.lop ? `• ${alertData.lop}` : ""}
                    </Text>
                    {alertData.so_dien_thoai ? (
                      <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                        SĐT: {alertData.so_dien_thoai}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Nội dung chi tiết sự cố */}
                {alertData.message ? (
                  <View style={[styles.infoRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
                    <View style={[styles.iconPill, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                      <Feather name="message-square" size={15} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>NỘI DUNG SỰ CỐ</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {alertData.message}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Hướng dẫn an toàn */}
              <View style={styles.safetyNoteRow}>
                <Feather name="shield" size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.safetyNoteText, { color: colors.textSecondary }]}>
                  Nếu bạn đang ở gần vị trí này, vui lòng tiếp cận hỗ trợ hoặc liên hệ ngay Đội An ninh!
                </Text>
              </View>
            </ScrollView>

            {/* Nhóm nút tương tác hành động */}
            <View style={styles.actionGroup}>
              {/* Nút chính: Gọi ngay Đội Bảo vệ Trường */}
              <TouchableOpacity
                onPress={handleCallSecurity}
                activeOpacity={0.85}
                style={styles.primaryCallTouch}
              >
                <LinearGradient
                  colors={["#DC2626", "#B91C1C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryCallBtn}
                >
                  <Feather name="phone-call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryCallText}>GỌI BẢO VỆ (0329106783)</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Hàng nút phụ: Mở bản đồ 3D & Đóng */}
              <View style={styles.secondaryBtnRow}>
                <TouchableOpacity
                  onPress={handleOpenMap}
                  activeOpacity={0.75}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
                    },
                  ]}
                >
                  <Feather name="map" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Bản đồ 3D</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDismiss}
                  activeOpacity={0.75}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
                    },
                  ]}
                >
                  <Feather name="check" size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Đã hiểu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  topAccentBar: {
    height: 6,
    width: "100%",
  },
  modalContent: {
    padding: 22,
    alignItems: "center",
  },
  beaconWrapper: {
    position: "relative",
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  beaconPulseHalo: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(239, 68, 68, 0.4)",
  },
  beaconCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  badgeText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 12,
  },
  scrollArea: {
    maxHeight: 280,
    width: "100%",
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  infoBox: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 18,
  },
  infoSubtext: {
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  distanceBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#DC2626",
  },
  safetyNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 2,
  },
  safetyNoteText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
    fontStyle: "italic",
  },
  actionGroup: {
    width: "100%",
    gap: 10,
    marginTop: 14,
  },
  primaryCallTouch: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryCallText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  secondaryBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
