import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { NotificationAlertItem } from "../types";

export interface HomeNoticeModalProps {
  alert: NotificationAlertItem | null;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onDismiss?: (alertId: string | number) => void;
}

export const HomeNoticeModal = React.memo(function HomeNoticeModal({
  alert,
  onClose,
  onNavigate,
  onDismiss,
}: HomeNoticeModalProps) {
  const { colors, isDark } = useTheme();

  if (!alert) return null;

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1 }]}>
          {/* Header Modal */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor:
                    alert.variant === "success"
                      ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5")
                      : alert.variant === "warning"
                      ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#FFFBEB")
                      : (isDark ? "rgba(59, 130, 246, 0.2)" : "#EFF6FF"),
                },
              ]}
            >
              <Feather
                name={
                  alert.variant === "success"
                    ? "check-circle"
                    : alert.variant === "warning"
                    ? "alert-triangle"
                    : "info"
                }
                size={20}
                color={
                  alert.variant === "success"
                    ? colors.success
                    : alert.variant === "warning"
                    ? colors.warning
                    : colors.info
                }
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {alert.type === "feedback"
                  ? "Trạng thái phản hồi"
                  : alert.type === "sos"
                  ? "Cảnh báo khẩn cấp"
                  : "Thông báo từ trường"}
              </Text>
              <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
                {alert.date || "30/9/2026"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? "#334155" : "#F1F5F9" }]}
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Badge trạng thái */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  alert.variant === "success"
                    ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7")
                    : alert.variant === "warning"
                    ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7")
                    : (isDark ? "rgba(59, 130, 246, 0.2)" : "#DBEAFE"),
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    alert.variant === "success"
                      ? colors.success
                      : alert.variant === "warning"
                      ? colors.warning
                      : colors.info,
                },
              ]}
            >
              {alert.status || "ĐÃ GỬI"}
            </Text>
          </View>

          {/* Tiêu đề & Nội dung */}
          <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
          <Text style={[styles.alertContent, { color: colors.textSecondary }]}>{alert.content}</Text>

          {/* Nút hành động */}
          <View style={styles.actionRow}>
            {alert.actionScreen ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onNavigate(alert.actionScreen!);
                }}
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryActionText}>
                  {alert.actionScreen === "feedback"
                    ? "Xem danh sách phản hồi"
                    : alert.actionScreen === "sos"
                    ? "Xem trang cứu hộ SOS"
                    : "Xem chi tiết"}
                </Text>
              </TouchableOpacity>
            ) : null}

            {onDismiss ? (
              <TouchableOpacity
                onPress={() => {
                  onDismiss(alert.id);
                  onClose();
                }}
                style={[
                  styles.deleteModalBtn,
                  isDark && { backgroundColor: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.4)" },
                ]}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.deleteModalText}>Xoá</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeModalBtn,
                { backgroundColor: isDark ? "#334155" : "#F1F5F9" },
                !alert.actionScreen && { flex: 1 },
              ]}
            >
              <Text style={[styles.closeModalText, { color: colors.text }]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  headerDate: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 8,
  },
  alertContent: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  closeModalBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  closeModalText: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteModalText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
});
