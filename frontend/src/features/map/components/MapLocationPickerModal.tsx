import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { TNU_SAMPLE_TEST_LOCATIONS } from "../constants";

interface MapLocationPickerModalProps {
  visible: boolean;
  insetsBottom: number;
  onClose: () => void;
  onSelectRealGps: () => void;
  onSelectSampleLocation: (sample: (typeof TNU_SAMPLE_TEST_LOCATIONS)[0]) => void;
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = React.memo(
  ({ visible, insetsBottom, onClose, onSelectRealGps, onSelectSampleLocation }) => {
    const { colors, isDark } = useTheme();

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insetsBottom, 20),
              maxHeight: "82%",
              borderWidth: 1,
              borderColor: colors.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.4 : 0.15,
              shadowRadius: 12,
              elevation: 16,
            }}
          >
            {/* Thanh kéo nhỏ phía trên */}
            <View style={{ alignItems: "center", marginBottom: 14 }}>
              <View style={{ width: 40, height: 4.5, borderRadius: 3, backgroundColor: isDark ? "#475569" : "#E2E8F0" }} />
            </View>

            {/* Tiêu đề Modal */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <View>
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
                  Chọn điểm định vị của bạn
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  Dùng GPS điện thoại hoặc vị trí mẫu để test tính năng trong trường
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.muted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="x" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* Tùy chọn 1: Bắt GPS thực tế của điện thoại */}
              <TouchableOpacity
                onPress={onSelectRealGps}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(37, 99, 235, 0.18)" : "#EFF6FF",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 14,
                  borderWidth: 1.5,
                  borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "#93C5FD",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: "800", color: isDark ? "#93C5FD" : "#1E40AF" }}>
                      Vị trí GPS thực tế của máy
                    </Text>
                    <View
                      style={{
                        backgroundColor: isDark ? "rgba(37, 99, 235, 0.3)" : "#DBEAFE",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "800", color: isDark ? "#93C5FD" : "#2563EB" }}>Vệ tinh</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11.5, color: isDark ? "#60A5FA" : "#3B82F6", marginTop: 2 }}>
                    Bắt tọa độ thật từ chip GPS điện thoại (quét 1 lần, không nóng máy)
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={isDark ? "#60A5FA" : "#3B82F6"} />
              </TouchableOpacity>

              {/* Phân cách danh sách vị trí mẫu */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                  marginLeft: 2,
                }}
              >
                Vị trí mẫu tại trường ĐH Tây Nguyên (Dùng test nhanh)
              </Text>

              {TNU_SAMPLE_TEST_LOCATIONS.map((sample) => (
                <TouchableOpacity
                  key={sample.id}
                  onPress={() => onSelectSampleLocation(sample)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 9,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: sample.id === "hospital_gate" ? (isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2") : colors.muted,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <MaterialIcons
                      name={sample.icon as any}
                      size={20}
                      color={sample.id === "hospital_gate" ? "#EF4444" : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: "800", color: colors.text }}>
                        {sample.name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 2 }}>
                      {sample.desc}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }
);

MapLocationPickerModal.displayName = "MapLocationPickerModal";
