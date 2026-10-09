import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AppColors } from "../../../src/constants/appColors";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiChangePassword } from "../../../src/services/api";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // Trạng thái Popup thông báo (Modal)
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">("success");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const handleOpenPopup = (type: "success" | "error" | "warning", title: string, message: string) => {
    setPopupType(type);
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    if (popupType === "success") {
      router.replace("/(main)/profile");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      handleOpenPopup("warning", "Thiếu thông tin", "Vui lòng nhập mật khẩu hiện tại của bạn.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      handleOpenPopup("warning", "Mật khẩu chưa đủ mạnh", "Mật khẩu mới phải có ít nhất 6 ký tự để đảm bảo an toàn.");
      return;
    }
    if (newPassword !== confirmPassword) {
      handleOpenPopup("warning", "Mật khẩu không khớp", "Xác nhận mật khẩu mới không trùng khớp. Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiChangePassword(currentPassword, newPassword);
      if (res && res.success) {
        handleOpenPopup(
          "success",
          "Đổi mật khẩu thành công!",
          "Mật khẩu tài khoản sinh viên của bạn đã được cập nhật. Vui lòng ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo."
        );
      } else {
        handleOpenPopup(
          "error",
          "Không thể đổi mật khẩu",
          res?.message || "Mật khẩu hiện tại không chính xác hoặc đã có lỗi xảy ra. Vui lòng thử lại."
        );
      }
    } catch {
      handleOpenPopup("error", "Lỗi kết nối", "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Đổi mật khẩu"
        subtitle="Bảo vệ an toàn tài khoản sinh viên"
        showBack={true}
        onBack={() => router.replace("/(main)/profile")}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#EFF6FF",
            borderWidth: 1,
            borderColor: "#BFDBFE",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 13, color: AppColors.primary, lineHeight: 20, fontWeight: "600" }}>
            Lưu ý: Mật khẩu mới cần tối thiểu 6 ký tự. Tránh sử dụng ngày sinh hoặc chuỗi ký tự dễ đoán.
          </Text>
        </View>

        {/* Mật khẩu hiện tại */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
          Mật khẩu hiện tại <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 48,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            paddingHorizontal: 14,
            marginBottom: 16,
          }}
        >
          <TextInput
            placeholder="Nhập mật khẩu hiện tại"
            placeholderTextColor={AppColors.textMuted}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            style={{ flex: 1, fontSize: 14, color: AppColors.text }}
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
            <Feather name={showCurrent ? "eye" : "eye-off"} size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Mật khẩu mới */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
          Mật khẩu mới <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 48,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            paddingHorizontal: 14,
            marginBottom: 16,
          }}
        >
          <TextInput
            placeholder="Tối thiểu 6 ký tự"
            placeholderTextColor={AppColors.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            style={{ flex: 1, fontSize: 14, color: AppColors.text }}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Feather name={showNew ? "eye" : "eye-off"} size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Xác nhận mật khẩu mới */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text, marginBottom: 6 }}>
          Xác nhận mật khẩu mới <Text style={{ color: AppColors.danger }}>*</Text>
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 48,
            borderRadius: 14,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            paddingHorizontal: 14,
            marginBottom: 28,
          }}
        >
          <TextInput
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor={AppColors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            style={{ flex: 1, fontSize: 14, color: AppColors.text }}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: AppColors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: AppColors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>Cập nhật mật khẩu</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── MODAL THÔNG BÁO POPUP KẾT QUẢ ĐỔI MẬT KHẨU ── */}
      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePopup}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Vòng tròn biểu tượng */}
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor:
                  popupType === "success"
                    ? "#ECFDF5"
                    : popupType === "error"
                    ? "#FEF2F2"
                    : "#FFFBEB",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 2,
                borderColor:
                  popupType === "success"
                    ? "#A7F3D0"
                    : popupType === "error"
                    ? "#FECACA"
                    : "#FDE68A",
              }}
            >
              {popupType === "success" && (
                <Feather name="check-circle" size={34} color="#10B981" />
              )}
              {popupType === "error" && (
                <Feather name="alert-circle" size={34} color="#EF4444" />
              )}
              {popupType === "warning" && (
                <Feather name="alert-triangle" size={34} color="#F59E0B" />
              )}
            </View>

            {/* Tiêu đề */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#0F172A",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {popupTitle}
            </Text>

            {/* Nội dung thông báo */}
            <Text
              style={{
                fontSize: 13.5,
                color: "#64748B",
                textAlign: "center",
                lineHeight: 21,
                marginBottom: 22,
              }}
            >
              {popupMessage}
            </Text>

            {/* Nút bấm xác nhận */}
            <TouchableOpacity
              onPress={handleClosePopup}
              activeOpacity={0.85}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 14,
                backgroundColor:
                  popupType === "success" ? "#10B981" : AppColors.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: popupType === "success" ? "#10B981" : AppColors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>
                {popupType === "success" ? "Xác nhận & Quay lại" : "Đã hiểu"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

