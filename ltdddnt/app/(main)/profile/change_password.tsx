import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Thông báo", "Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Thông báo", "Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiChangePassword(currentPassword, newPassword);
      if (res && res.success) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới của bạn.", [
          { text: "Đồng ý", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Lỗi", res?.message || "Mật khẩu hiện tại không chính xác hoặc đã có lỗi xảy ra.");
      }
    } catch {
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top', 'left', 'right']}>
      <NavHeader
        title="Đổi mật khẩu"
        subtitle="Bảo vệ an toàn tài khoản sinh viên"
        showBack={true}
        onBack={() => router.back()}
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
    </SafeAreaView>
  );
}

