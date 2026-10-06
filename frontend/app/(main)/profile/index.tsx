import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors } from "../../../src/constants/appColors";
import { mainStyles as s } from "../../../src/constants/globalStyles";
import { NavHeader } from "../../../src/components/NavHeader";
import { setTabBarVisible, useTabBarScrollHandler } from "../../../src/components/MainTabs";
import { apiGetProfile, apiUpdateProfile, apiLogout, clearAuthAndCache } from "../../../src/services/api";

interface UserProfile {
  mssv: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  lop: string;
  khoa: string;
  avatar?: string;
}

const PRESET_AVATARS = [
  { id: "1", label: "Sinh viên Nam 1", uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80" },
  { id: "2", label: "Sinh viên Nữ 1", uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80" },
  { id: "3", label: "Sinh viên Nam 2", uri: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80" },
  { id: "4", label: "Sinh viên Nữ 2", uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80" },
  { id: "5", label: "Avatar 3D Nam", uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
  { id: "6", label: "Avatar 3D Nữ", uri: "https://cdn-icons-png.flaticon.com/512/3135/3135789.png" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { onScroll: onTabBarScroll, bottomPadding } = useTabBarScrollHandler();
  const [profile, setProfile] = useState<UserProfile>({
    mssv: "",
    ho_ten: "Đang tải...",
    email: "",
    so_dien_thoai: "",
    lop: "",
    khoa: "",
    avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editForm, setEditForm] = useState({
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
    lop: "",
    khoa: "",
    avatar: "",
  });
  const [saving, setSaving] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Tự động ẩn thanh điều hướng dưới cùng (Bottom Nav) khi mở bất kỳ modal nào
  useEffect(() => {
    const isModalOpen = editModalVisible || avatarModalVisible || logoutModalVisible;
    setTabBarVisible(!isModalOpen);

    if (navigation && (navigation as any).setOptions) {
      (navigation as any).setOptions({
        tabBarStyle: isModalOpen ? { display: "none" } : undefined,
      });
    }

    const parent = (navigation as any).getParent?.();
    if (parent && parent.setOptions) {
      parent.setOptions({
        tabBarStyle: isModalOpen ? { display: "none" } : undefined,
      });
    }

    return () => {
      setTabBarVisible(true);
      if (navigation && (navigation as any).setOptions) {
        (navigation as any).setOptions({ tabBarStyle: undefined });
      }
      const p = (navigation as any).getParent?.();
      if (p && p.setOptions) {
        p.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [editModalVisible, avatarModalVisible, logoutModalVisible, navigation]);

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
          avatar: localUser.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
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
            avatar: remote.avatar || localUser.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
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
      avatar: profile.avatar || "",
    });
    setEditModalVisible(true);
  };

  const [returnToEditModal, setReturnToEditModal] = useState(false);

  const openAvatarModalFromEdit = () => {
    setReturnToEditModal(true);
    setEditModalVisible(false);
    setTimeout(() => {
      setAvatarModalVisible(true);
    }, 200);
  };

  const closeAvatarModal = () => {
    setAvatarModalVisible(false);
    if (returnToEditModal) {
      setReturnToEditModal(false);
      setTimeout(() => {
        setEditModalVisible(true);
      }, 200);
    }
  };

  const applyAvatar = async (newAvatarUri: string) => {
    if (!newAvatarUri) return;
    setUploadingAvatar(true);
    try {
      const res = await apiUpdateProfile({
        ...profile,
        fullName: profile.ho_ten,
        phone: profile.so_dien_thoai,
        avatar: newAvatarUri,
      });

      if (res && res.success) {
        const updated = {
          ...profile,
          avatar: newAvatarUri,
        };
        setProfile(updated);
        setEditForm((f) => ({ ...f, avatar: newAvatarUri }));
        await AsyncStorage.setItem("@auth_user", JSON.stringify(updated));
        Alert.alert("Thành công", "Đã cập nhật ảnh đại diện mới.");
        closeAvatarModal();
      } else {
        Alert.alert("Lỗi", res?.message || "Không thể cập nhật ảnh đại diện.");
      }
    } catch {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi lưu ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Quyền truy cập", "Cần cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const avatarData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        await applyAvatar(avatarData);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể chọn ảnh: " + (err.message || ""));
    }
  };

  const handlePickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Quyền truy cập", "Cần cấp quyền máy ảnh để chụp ảnh đại diện mới.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const avatarData = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        await applyAvatar(avatarData);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể chụp ảnh: " + (err.message || ""));
    }
  };

  const handleApplyCustomUrl = async () => {
    if (!customAvatarUrl.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đường link ảnh.");
      return;
    }
    await applyAvatar(customAvatarUrl.trim());
    setCustomAvatarUrl("");
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
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
      <NavHeader
        title="Hồ sơ sinh viên"
        subtitle="Thông tin cá nhân & Tài khoản"
        rightElement={
          <TouchableOpacity onPress={openEditModal}>
            <Feather name="edit-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPadding }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
      >
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
          {/* Avatar Container với Badge Camera */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAvatarModalVisible(true)}
            style={{ position: "relative", marginBottom: 12 }}
          >
            {profile.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: "#E2E8F0",
                  borderWidth: 3,
                  borderColor: "#EEF2FF",
                }}
              />
            ) : (
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: AppColors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 36, fontWeight: "900", color: "#FFFFFF" }}>
                  {profile.ho_ten ? profile.ho_ten.charAt(0).toUpperCase() : "S"}
                </Text>
              </View>
            )}

            {/* Nút biểu tượng máy ảnh để thay đổi */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: AppColors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2.5,
                borderColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 4,
              }}
            >
              <Feather name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAvatarModalVisible(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: "#EEF2FF",
              marginBottom: 10,
            }}
          >
            <Feather name="image" size={12} color={AppColors.primary} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: AppColors.primary }}>
              Đổi ảnh đại diện
            </Text>
          </TouchableOpacity>

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
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Feather name="check-circle" size={12} color="#059669" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669" }}>Đang theo học chính quy</Text>
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
      {editModalVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            zIndex: 999,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
            style={{ flex: 1 }}
          />
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
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openAvatarModalFromEdit}
                  style={{ position: "relative" }}
                >
                  {editForm.avatar ? (
                    <Image
                      source={{ uri: editForm.avatar }}
                      style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#E2E8F0" }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: AppColors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name="user" size={32} color="#FFFFFF" />
                    </View>
                  )}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: AppColors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "#FFFFFF",
                    }}
                  >
                    <Feather name="camera" size={11} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openAvatarModalFromEdit}
                  style={{ marginTop: 6 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: AppColors.primary }}>
                    Thay đổi ảnh đại diện
                  </Text>
                </TouchableOpacity>
              </View>

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
      )}

      {/* Modal Popup Xác nhận Đăng xuất */}
      {logoutModalVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            zIndex: 999,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={cancelLogout} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
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
      )}

      {/* Modal Thay đổi ảnh đại diện */}
      {avatarModalVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            zIndex: 999,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeAvatarModal}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: AppColors.cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "85%",
            }}
          >
            <View style={[s.row, s.between, { marginBottom: 18 }]}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: AppColors.text }}>
                  Chọn ảnh đại diện
                </Text>
                <Text style={{ fontSize: 12, color: AppColors.textMuted, marginTop: 2 }}>
                  Tải ảnh từ máy, chụp ảnh mới hoặc chọn avatar mẫu
                </Text>
              </View>
              <TouchableOpacity onPress={closeAvatarModal}>
                <Feather name="x" size={22} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {uploadingAvatar && (
                <View
                  style={{
                    padding: 14,
                    backgroundColor: "#EEF2FF",
                    borderRadius: 12,
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <ActivityIndicator size="small" color={AppColors.primary} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.primary, marginTop: 6 }}>
                    Đang lưu ảnh đại diện...
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={handlePickFromLibrary}
                  disabled={uploadingAvatar}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: "#EEF2FF",
                    borderWidth: 1.5,
                    borderColor: "#C7D2FE",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="image" size={22} color={AppColors.primary} />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: AppColors.primary }}>
                    Thư viện ảnh
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickFromCamera}
                  disabled={uploadingAvatar}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: "#ECFDF5",
                    borderWidth: 1.5,
                    borderColor: "#A7F3D0",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="camera" size={22} color="#059669" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#059669" }}>
                    Chụp ảnh mới
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 13, fontWeight: "800", color: AppColors.text, marginBottom: 10 }}>
                Hoặc chọn mẫu sinh viên có sẵn
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                {PRESET_AVATARS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => applyAvatar(item.uri)}
                    disabled={uploadingAvatar}
                    activeOpacity={0.7}
                    style={{
                      width: "30%",
                      alignItems: "center",
                      padding: 8,
                      borderRadius: 14,
                      backgroundColor: profile.avatar === item.uri ? "#EEF2FF" : AppColors.muted,
                      borderWidth: profile.avatar === item.uri ? 2 : 1,
                      borderColor: profile.avatar === item.uri ? AppColors.primary : "transparent",
                    }}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#CBD5E1" }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: AppColors.textSecondary,
                        marginTop: 6,
                        textAlign: "center",
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 13, fontWeight: "800", color: AppColors.text, marginBottom: 8 }}>
                Hoặc dán đường dẫn ảnh (URL)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
                <TextInput
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor={AppColors.textMuted}
                  value={customAvatarUrl}
                  onChangeText={setCustomAvatarUrl}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    paddingHorizontal: 12,
                    fontSize: 13,
                    color: AppColors.text,
                    backgroundColor: AppColors.muted,
                  }}
                />
                <TouchableOpacity
                  onPress={handleApplyCustomUrl}
                  disabled={uploadingAvatar}
                  activeOpacity={0.8}
                  style={{
                    height: 44,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: AppColors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}