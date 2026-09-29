import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { apiChangePassword } from "@/src/services/api";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [obscureCurrent, setObscureCurrent] = useState(true);
  const [obscureNew, setObscureNew] = useState(true);
  const [obscureConfirm, setObscureConfirm] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChangePassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiChangePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMsg(res.message || "Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          router.back();
        }, 1200);
      } else {
        setErrorMsg(res.message || "Đổi mật khẩu thất bại.");
      }
    } catch {
      setErrorMsg("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 24, 
        paddingTop: Math.max(insets.top + 16, 20), 
        paddingBottom: 20, 
        backgroundColor: AppColors.primary,
        zIndex: 10
      }}>
        <View style={[s.row, { gap: 12, alignItems: "center" }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[s.iconBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <Feather name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>Đổi mật khẩu</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Cập nhật mật khẩu bảo mật tài khoản</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, gap: 18 }} 
        keyboardShouldPersistTaps="handled"
      >
        {errorMsg ? (
          <View style={[s.card, { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5", padding: 16, borderRadius: 16 }]}>
            <Text style={{ color: "#991B1B", fontWeight: "800", fontSize: 13 }}>{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={[s.card, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0", padding: 16, borderRadius: 16 }]}>
            <Text style={{ color: "#065F46", fontWeight: "800", fontSize: 13 }}>{successMsg}</Text>
          </View>
        ) : null}

        <View style={[s.card, { padding: 20, borderRadius: 20, gap: 16 }]}>
          {/* Current Password */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: AppColors.textMuted, letterSpacing: 0.5 }}>MẬT KHẨU HIỆN TẠI</Text>
            <View style={[s.inputRow, { borderRadius: 14, paddingHorizontal: 14 }]}>
              <Feather name="lock" size={18} color={AppColors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[s.input, { paddingHorizontal: 0, flex: 1 }]}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor={AppColors.textSubtle}
                secureTextEntry={obscureCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setObscureCurrent(!obscureCurrent)}>
                <MaterialIcons name={obscureCurrent ? "visibility" : "visibility-off"} size={18} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: AppColors.textMuted, letterSpacing: 0.5 }}>MẬT KHẨU MỚI</Text>
            <View style={[s.inputRow, { borderRadius: 14, paddingHorizontal: 14 }]}>
              <Feather name="lock" size={18} color={AppColors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[s.input, { paddingHorizontal: 0, flex: 1 }]}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                placeholderTextColor={AppColors.textSubtle}
                secureTextEntry={obscureNew}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setObscureNew(!obscureNew)}>
                <MaterialIcons name={obscureNew ? "visibility" : "visibility-off"} size={18} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: AppColors.textMuted, letterSpacing: 0.5 }}>XÁC NHẬN MẬT KHẨU MỚI</Text>
            <View style={[s.inputRow, { borderRadius: 14, paddingHorizontal: 14 }]}>
              <Feather name="lock" size={18} color={AppColors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[s.input, { paddingHorizontal: 0, flex: 1 }]}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={AppColors.textSubtle}
                secureTextEntry={obscureConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setObscureConfirm(!obscureConfirm)}>
                <MaterialIcons name={obscureConfirm ? "visibility" : "visibility-off"} size={18} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 10 }} />

          <TouchableOpacity 
            onPress={handleChangePassword} 
            disabled={loading}
            style={{ 
              backgroundColor: AppColors.primary, 
              paddingVertical: 14, 
              borderRadius: 14, 
              alignItems: "center", 
              justifyContent: "center",
              opacity: loading ? 0.7 : 1 
            }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>Xác nhận đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
