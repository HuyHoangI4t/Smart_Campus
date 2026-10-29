import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Pressable } from "react-native";
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

  const isResolved =
    alert.variant === "success" ||
    alert.status?.toLowerCase().includes("đã xử lý") ||
    alert.status?.toLowerCase().includes("đã giải quyết") ||
    alert.status?.toLowerCase().includes("hoàn tất");

  const isSos = alert.type === "sos";
  const isFeedback = alert.type === "feedback";

  let accentColor = colors.primary;
  let accentBg = isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF";
  let accentBorder = isDark ? "rgba(59, 130, 246, 0.35)" : "#BFDBFE";
  let iconName: keyof typeof Feather.glyphMap = "info";
  let modalCategoryLabel = "THÔNG BÁO TỪ TRƯỜNG";
  let modalTitle = "Thông báo chính thức";

  if (isSos) {
    if (isResolved) {
      accentColor = "#10B981";
      accentBg = isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5";
      accentBorder = isDark ? "rgba(16, 185, 129, 0.35)" : "#A7F3D0";
      iconName = "check-circle";
      modalCategoryLabel = "CỨU HỘ SOS • ĐÃ XỬ LÝ AN TOÀN";
      modalTitle = "Xử lý sự cố an toàn";
    } else {
      accentColor = "#EF4444";
      accentBg = isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2";
      accentBorder = isDark ? "rgba(239, 68, 68, 0.35)" : "#FECACA";
      iconName = "alert-triangle";
      modalCategoryLabel = "CẢNH BÁO KHẨN CẤP SOS";
      modalTitle = "Tín hiệu SOS trường học";
    }
  } else if (isFeedback) {
    if (isResolved) {
      accentColor = "#10B981";
      accentBg = isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5";
      accentBorder = isDark ? "rgba(16, 185, 129, 0.35)" : "#A7F3D0";
      iconName = "check-circle";
      modalCategoryLabel = "PHẢN HỒI • ĐÃ GIẢI QUYẾT";
      modalTitle = "Tiến độ phản hồi cơ sở";
    } else {
      accentColor = "#F59E0B";
      accentBg = isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB";
      accentBorder = isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A";
      iconName = "message-square";
      modalCategoryLabel = "PHẢN HỒI • ĐANG XỬ LÝ";
      modalTitle = "Ý kiến phản hồi sinh viên";
    }
  }

  const getActionLabel = () => {
    if (alert.actionScreen === "sos") return "Xem trang cứu hộ SOS";
    if (alert.actionScreen === "feedback") return "Xem danh sách phản hồi";
    return "Xem chi tiết";
  };

  const getActionIcon = (): keyof typeof Feather.glyphMap => {
    if (alert.actionScreen === "sos") return "shield";
    if (alert.actionScreen === "feedback") return "message-circle";
    return "arrow-right-circle";
  };

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng popup khi chạm ra ngoài" />
        <View
          style={[
            styles.modalBox,
            {
              backgroundColor: colors.cardBg,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
            },
          ]}
        >
          {/* Header Modal */}
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Feather name={iconName} size={22} color={accentColor} />
            </View>

            <View style={styles.headerTextCol}>
              <View style={[styles.categoryBadge, { backgroundColor: accentBg }]}>
                <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.categoryBadgeText, { color: accentColor }]}>
                  {modalCategoryLabel}
                </Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {modalTitle}
              </Text>
            </View>


          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Banner trạng thái tiến trình xử lý từ nhà trường */}
            <View style={[styles.statusBanner, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <View style={styles.statusBannerTop}>
                <View style={[styles.statusIndicatorCircle, { backgroundColor: accentColor }]}>
                  <Feather
                    name={isResolved ? "check" : isSos ? "radio" : "loader"}
                    size={13}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={[styles.statusBannerHeading, { color: accentColor }]}>
                  {isResolved
                    ? "Trạng thái: Đã xử lý an toàn"
                    : isSos
                    ? "Trạng thái: Đang tiếp nhận & hỗ trợ"
                    : isFeedback ? `Trạng thái: ${alert.status || "Đang xử lý"}` : "Thông báo chính thức từ Nhà trường"}
                </Text>
              </View>
              <Text style={[styles.statusBannerDesc, { color: colors.textSecondary }]}>
                {isResolved
                  ? "Sự việc đã được đội an ninh / ban quản lý kiểm tra và giải quyết hoàn tất."
                  : isSos
                  ? "Tín hiệu SOS đã được hệ thống truyền trực tiếp đến đội bảo vệ và y tế trường."
                  : isFeedback
                  ? "Ý kiến phản hồi của bạn đã được ghi nhận và đang được bộ phận chuyên trách giải quyết."
                  : `Văn bản thông báo được phát hành chính thức bởi ${alert.sender || "Nhà trường"} tới toàn thể sinh viên.`}
              </Text>
            </View>

            {/* Chi tiết thông tin */}
            <View style={styles.detailSection}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>

              {/* Thông tin Meta: Ngày giờ + Đơn vị / Vị trí */}
              <View style={styles.metaList}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Thời gian: <Text style={{ fontWeight: "700", color: colors.text }}>{alert.date || alert.subtitle || "Hôm nay"}</Text>
                  </Text>
                </View>

                {alert.location ? (
                  <View style={styles.metaItem}>
                    <Feather name="map-pin" size={13} color={accentColor} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      Vị trí: <Text style={{ fontWeight: "700", color: colors.text }}>{alert.location}</Text>
                    </Text>
                  </View>
                ) : null}

                {alert.sender ? (
                  <View style={styles.metaItem}>
                    <Feather name="shield" size={13} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      Đơn vị: <Text style={{ fontWeight: "700", color: colors.text }}>{alert.sender}</Text>
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Hộp nội dung chi tiết */}
              <View
                style={[
                  styles.contentCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={[styles.contentCardLabel, { color: colors.textSecondary }]}>
                  NỘI DUNG CHI TIẾT
                </Text>
                <Text style={[styles.alertContent, { color: colors.text }]}>
                  {alert.content || "Không có mô tả chi tiết."}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Cụm nút hành động được thiết kế thoáng đãng */}
          <View style={styles.actionContainer}>
            {/* Nút chính chuyển hướng tới trang chức năng */}
            {alert.actionScreen ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onNavigate(alert.actionScreen!);
                }}
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: isSos && !isResolved ? "#DC2626" : colors.primary,
                  },
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.primaryActionLeft}>
                  <Feather name={getActionIcon()} size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>{getActionLabel()}</Text>
                </View>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}

            {/* Hàng nút phụ: Xoá thông báo & Đóng modal */}
            <View style={styles.secondaryRow}>
              {onDismiss ? (
                <TouchableOpacity
                  onPress={() => {
                    onDismiss(alert.id);
                    onClose();
                  }}
                  style={[
                    styles.deleteModalBtn,
                    {
                      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
                      borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FEE2E2",
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                  <Text style={styles.deleteModalText}>Xoá thông báo</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeModalBtn,
                  {
                    backgroundColor: isDark ? "#334155" : "#F1F5F9",
                    borderColor: isDark ? "#475569" : "#E2E8F0",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeModalText, { color: colors.text }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "85%",
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    maxHeight: 380,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusIndicatorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBannerHeading: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusBannerDesc: {
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: 28,
  },
  detailSection: {
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 10,
  },
  metaList: {
    gap: 6,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
  },
  contentCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  contentCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  alertContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 14,
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  deleteModalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteModalText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },
  closeModalBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeModalText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
