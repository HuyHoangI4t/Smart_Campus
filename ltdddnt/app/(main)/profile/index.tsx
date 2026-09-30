import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { apiGetProfile, apiUpdateProfile, apiLogout, clearAuthAndCache } from "../../../src/services/api";

interface UserProfile {
  mssv: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  lop: string;
  khoa: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    mssv: "",
    ho_ten: "Đang tải...",
    email: "",
    so_dien_thoai: "",
    lop: "",
    khoa: "",
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
    lop: "",
    khoa: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem("@auth_user");
      let localUser: any = {};
      if (userStr) {
        localUser = JSON.parse(userStr);
        setProfile({
          mssv: localUser.mssv || "",
          ho_ten: localUser.ho_ten || localUser.fullName || localUser.full_name || "Sinh viên",
          email: localUser.email || "",
          so_dien_thoai: localUser.so_dien_thoai || localUser.phone || "",
          lop: localUser.lop || "K23",
          khoa: localUser.khoa || "Công nghệ Thông tin",
          ngay_sinh: localUser.ngay_sinh || "",
          gioi_tinh: localUser.gioi_tinh || "",
        });
      }

      const mssv = localUser.mssv || localUser.masv;
      if (mssv && mssv !== "guest") {
        const res = await apiGetProfile(mssv);
        if (res && res.success && res.student) {
          const remote = res.student;
          const merged: UserProfile = {
            mssv: remote.mssv || mssv,
            ho_ten: remote.ho_ten || remote.fullName || localUser.ho_ten || "Sinh viên",
            email: remote.email || localUser.email || "",
            so_dien_thoai: remote.so_dien_thoai || remote.phone || localUser.so_dien_thoai || "",
            lop: remote.lop || localUser.lop || "K23",
            khoa: remote.khoa || localUser.khoa || "Công nghệ Thông tin",
            ngay_sinh: remote.ngay_sinh || localUser.ngay_sinh || "2005-05-15",
            gioi_tinh: remote.gioi_tinh || localUser.gioi_tinh || "Nam",
          };
          setProfile(merged);
          await AsyncStorage.setItem("@auth_user", JSON.stringify({ ...localUser, ...merged }));
        }
      }
    } catch {
      // Keep cached
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const openEditModal = () => {
    setEditForm({
      ho_ten: profile.ho_ten,
      email: profile.email,
      so_dien_thoai: profile.so_dien_thoai,
      lop: profile.lop,
      khoa: profile.khoa,
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.ho_ten.trim()) {
      Alert.alert("Thông báo", "Họ tên không được để trống.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiUpdateProfile({
        ...editForm,
        fullName: editForm.ho_ten,
        phone: editForm.so_dien_thoai,
      });
      if (res && res.success) {
        const updated = {
          ...profile,
          ...editForm,
          fullName: editForm.ho_ten,
          phone: editForm.so_dien_thoai,
        };
        setProfile(updated);
        await AsyncStorage.setItem("@auth_user", JSON.stringify(updated));
        Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân lên hệ thống.");
        setEditModalVisible(false);
      } else {
        Alert.alert("Lỗi", res?.message || "Không thể cập nhật hồ sơ vào lúc này.");
      }
    } catch {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await apiLogout();
    } catch (err) {
      console.error("Lỗi apiLogout:", err);
    } finally {
      await clearAuthAndCache();
      setLoggingOut(false);
      setLogoutModalVisible(false);
      router.replace("/(auth)");
    }
  };

  const cancelLogout = () => {
    if (!loggingOut) {
      setLogoutModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top', 'left', 'right']}>
      <NavHeader
        title="Hồ sơ sinh viên"
        subtitle="Thông tin cá nhân & Tài khoản"
        showBack={true}
        onBack={() => router.push("/(main)/home")}
        rightElement={
          <TouchableOpacity onPress={openEditModal}>
            <Feather name="edit-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        {/* Avatar & Header Card */}
        <View
          style={{
            padding: 24,
            borderRadius: 24,
            backgroundColor: AppColors.cardBg,
            alignItems: "center",
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: AppColors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFFFFF" }}>
              {profile.ho_ten ? profile.ho_ten.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: "900", color: AppColors.text, textAlign: "center" }}>
            {profile.ho_ten}
          </Text>
          <Text style={{ fontSize: 13, color: AppColors.primary, fontWeight: "700", marginTop: 4 }}>
            MSSV: {profile.mssv || "Chưa có"}
          </Text>
          <View
            style={{
              marginTop: 10,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: "#ECFDF5",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669" }}>● Đang theo học chính quy</Text>
          </View>
        </View>

        {/* Thông tin chi tiết */}
        <Text style={{ fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 12 }}>
          Thông tin học tập & liên hệ
        </Text>

        <View
          style={{
            padding: 16,
            borderRadius: 20,
            backgroundColor: AppColors.cardBg,
            borderWidth: 1,
            borderColor: AppColors.cardBorder,
            gap: 14,
            marginBottom: 24,
          }}
        >
          <View style={[s.row, s.between]}>
            <View style={[s.row, { gap: 10 }]}>
              <Feather name="book" size={16} color={AppColors.primary} />
              <Text style={{ fontSize: 13, color: AppColors.textSecondary, fontWeight: "600" }}>Khoa đào tạo</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>{profile.khoa || "Chưa cập nhật"}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: AppColors.cardBorder }} />

          <View style={[s.row, s.between]}>
            <View style={[s.row, { gap: 10 }]}>
              <Feather name="users" size={16} color={AppColors.primary} />
              <Text style={{ fontSize: 13, color: AppColors.textSecondary, fontWeight: "600" }}>Lớp sinh hoạt</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>{profile.lop || "Chưa cập nhật"}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: AppColors.cardBorder }} />

          <View style={[s.row, s.between]}>
            <View style={[s.row, { gap: 10 }]}>
              <Feather name="mail" size={16} color={AppColors.primary} />
              <Text style={{ fontSize: 13, color: AppColors.textSecondary, fontWeight: "600" }}>Email trường</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>{profile.email || "Chưa cập nhật"}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: AppColors.cardBorder }} />

          <View style={[s.row, s.between]}>
            <View style={[s.row, { gap: 10 }]}>
              <Feather name="phone" size={16} color={AppColors.primary} />
              <Text style={{ fontSize: 13, color: AppColors.textSecondary, fontWeight: "600" }}>Số điện thoại</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.text }}>{profile.so_dien_thoai || "Chưa cập nhật"}</Text>
          </View>
        </View>

        {/* Thiết lập & Bảo mật */}
        <Text style={{ fontSize: 15, fontWeight: "800", color: AppColors.text, marginBottom: 12 }}>
          Bảo mật tài khoản
        </Text>

        <View style={{ gap: 10, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.push("/(main)/profile/change_password")}
            activeOpacity={0.7}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: AppColors.cardBg,
              borderWidth: 1,
              borderColor: AppColors.cardBorder,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={[s.row, { gap: 12 }]}>
              <Feather name="lock" size={18} color={AppColors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: AppColors.text }}>Đổi mật khẩu tài khoản</Text>
            </View>
            <Feather name="chevron-right" size={18} color={AppColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openEditModal}
            activeOpacity={0.7}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: AppColors.cardBg,
              borderWidth: 1,
              borderColor: AppColors.cardBorder,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={[s.row, { gap: 12 }]}>
              <Feather name="user-check" size={18} color={AppColors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: AppColors.text }}>Chỉnh sửa hồ sơ cá nhân</Text>
            </View>
            <Feather name="chevron-right" size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Nút đăng xuất */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: "#FEF2F2",
            borderWidth: 1,
            borderColor: "#FECACA",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Feather name="log-out" size={18} color="#DC2626" />
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#DC2626" }}>Đăng xuất khỏi thiết bị</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: AppColors.cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "85%",
            }}
          >
            <View style={[s.row, s.between, { marginBottom: 20 }]}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: AppColors.text }}>Cập nhật hồ sơ</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={22} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginBottom: 4 }}>Họ và tên</Text>
              <TextInput
                value={editForm.ho_ten}
                onChangeText={(t) => setEditForm((f) => ({ ...f, ho_ten: t }))}
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  marginBottom: 12,
                  color: AppColors.text,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginBottom: 4 }}>Email</Text>
              <TextInput
                value={editForm.email}
                onChangeText={(t) => setEditForm((f) => ({ ...f, email: t }))}
                keyboardType="email-address"
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  marginBottom: 12,
                  color: AppColors.text,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginBottom: 4 }}>Số điện thoại</Text>
              <TextInput
                value={editForm.so_dien_thoai}
                onChangeText={(t) => setEditForm((f) => ({ ...f, so_dien_thoai: t }))}
                keyboardType="phone-pad"
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  marginBottom: 12,
                  color: AppColors.text,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginBottom: 4 }}>Lớp sinh hoạt</Text>
              <TextInput
                value={editForm.lop}
                onChangeText={(t) => setEditForm((f) => ({ ...f, lop: t }))}
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  marginBottom: 12,
                  color: AppColors.text,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.textSecondary, marginBottom: 4 }}>Khoa</Text>
              <TextInput
                value={editForm.khoa}
                onChangeText={(t) => setEditForm((f) => ({ ...f, khoa: t }))}
                style={{
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: AppColors.cardBorder,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  marginBottom: 20,
                  color: AppColors.text,
                }}
              />

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={saving}
                style={{
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: AppColors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Popup Xác nhận Đăng xuất */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: AppColors.cardBg,
              borderRadius: 24,
              padding: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#FEF2F2",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather name="log-out" size={26} color="#DC2626" />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: AppColors.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Đăng xuất
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: AppColors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              Bạn có chắc chắn muốn đăng xuất tài khoản khỏi thiết bị này?
            </Text>

            <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
              {/* Nút Hủy */}
              <TouchableOpacity
                onPress={cancelLogout}
                disabled={loggingOut}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: AppColors.textSecondary }}>
                  Hủy
                </Text>
              </TouchableOpacity>

              {/* Nút Xác nhận */}
              <TouchableOpacity
                onPress={confirmLogout}
                disabled={loggingOut}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                    Xác nhận
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

