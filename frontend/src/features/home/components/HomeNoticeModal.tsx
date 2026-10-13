import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppColors } from "../../../constants/appColors";
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
  if (!alert) return null;

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          {/* Header Modal */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor:
                    alert.variant === "success"
                      ? "#ECFDF5"
                      : alert.variant === "warning"
                      ? "#FFFBEB"
                      : "#EFF6FF",
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
                    ? "#10B981"
                    : alert.variant === "warning"
                    ? "#D97706"
                    : "#2563EB"
                }
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>
                {alert.type === "feedback"
                  ? "Trạng thái phản hồi"
                  : alert.type === "sos"
                  ? "Cảnh báo khẩn cấp"
                  : "Thông báo từ trường"}
              </Text>
              <Text style={styles.headerDate}>
                {alert.date || "30/9/2026"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Trạng thái Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  alert.variant === "success"
                    ? "#DCFCE7"
                    : alert.variant === "warning"
                    ? "#FEF3C7"
                    : "#DBEAFE",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    alert.variant === "success"
                      ? "#166534"
                      : alert.variant === "warning"
                      ? "#92400E"
                      : "#1E40AF",
                },
              ]}
            >
              {alert.status || "Đã tiếp nhận"}
            </Text>
          </View>

          {/* Tiêu đề & Nội dung */}
          <Text style={styles.alertTitle}>
            {alert.title}
          </Text>

          <Text style={styles.alertContent}>
            {alert.content}
          </Text>

          {/* Nút tác vụ */}
          <View style={styles.actionRow}>
            {alert.actionScreen ? (
              <TouchableOpacity
                onPress={() => {
                  const screen = alert.actionScreen;
                  onClose();
                  if (screen) onNavigate(screen);
                }}
                activeOpacity={0.8}
                style={styles.primaryActionBtn}
              >
                <Text style={styles.primaryActionText}>
                  {alert.type === "feedback"
                    ? "Xem / Gửi phản hồi"
                    : alert.type === "sos"
                    ? "Đến trang SOS"
                    : "Xem chi tiết"}
                </Text>
              </TouchableOpacity>
            ) : null}

            {onDismiss ? (
              <TouchableOpacity
                onPress={() => {
                  const id = alert.id;
                  onClose();
                  onDismiss(id);
                }}
                activeOpacity={0.8}
                style={styles.deleteModalBtn}
                accessibilityRole="button"
                accessibilityLabel="Xoá thông báo này"
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.deleteModalText}>Xoá</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={[
                styles.closeModalBtn,
                { flex: alert.actionScreen ? 0.5 : onDismiss ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.closeModalText}>Đóng</Text>
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
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
    color: "#1E293B",
  },
  headerDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
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
    color: "#1E293B",
    lineHeight: 21,
    marginBottom: 8,
  },
  alertContent: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: AppColors.primary,
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
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalText: {
    color: "#475569",
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

