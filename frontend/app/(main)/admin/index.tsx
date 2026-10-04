import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '../../../src/constants/appColors';
import { mainStyles as s } from '../../../src/constants/globalStyles';
import { NavHeader } from '../../../src/components/NavHeader';
import {
  apiAdminGetStats,
  apiAdminGetUsers,
  apiAdminCreateUser,
  apiAdminUpdateUser,
  apiAdminDeleteUser,
  apiAdminCreateNotification,
  apiAdminDeleteNotification,
  apiAdminGetFeedback,
  apiAdminDeleteFeedback,
  apiAdminGetSos,
  apiAdminDeleteSos,
  apiGetNotifications,
} from '../../../src/services/api';

type TabType = 'stats' | 'users' | 'notifications' | 'feedback' | 'sos';

export default function AdminScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats data
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalStudents: 0,
    totalNotifications: 0,
    totalFeedback: 0,
    totalSosAlerts: 0,
    totalGrades: 0,
  });
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [recentSos, setRecentSos] = useState<any[]>([]);

  // Users data
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    mssv: '',
    ho_ten: '',
    email: '',
    password: '',
    role: 'sinh_vien',
    so_dien_thoai: '',
    lop: 'Kỹ thuật phần mềm K23',
    khoa: 'Công nghệ Thông tin',
  });

  // Notifications data
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifForm, setNotifForm] = useState({
    title: '',
    content: '',
    type: 'info',
    sender: 'Phòng Đào Tạo',
  });

  // Feedback & SOS data
  const [allFeedback, setAllFeedback] = useState<any[]>([]);
  const [allSos, setAllSos] = useState<any[]>([]);

  const loadData = async () => {
    try {
      if (activeTab === 'stats') {
        const res = await apiAdminGetStats();
        if (res && res.success) {
          setStats(res.stats || {});
          setRecentFeedback(res.recentFeedback || []);
          setRecentSos(res.recentSos || []);
        }
      } else if (activeTab === 'users') {
        const res = await apiAdminGetUsers(searchUser);
        if (res && res.success) {
          setUsers(res.users || []);
        }
      } else if (activeTab === 'notifications') {
        const res = await apiGetNotifications();
        if (res && res.success) {
          setNotifications(res.notifications || []);
        }
      } else if (activeTab === 'feedback') {
        const res = await apiAdminGetFeedback();
        if (res && res.success) {
          setAllFeedback(res.feedback || []);
        }
      } else if (activeTab === 'sos') {
        const res = await apiAdminGetSos();
        if (res && res.success) {
          setAllSos(res.alerts || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ─── USER ACTIONS ────────────────────────────────────────────────────────
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      mssv: '',
      ho_ten: '',
      email: '',
      password: '',
      role: 'sinh_vien',
      so_dien_thoai: '',
      lop: 'Kỹ thuật phần mềm K23',
      khoa: 'Công nghệ Thông tin',
    });
    setUserModalVisible(true);
  };

  const openEditUserModal = (u: any) => {
    setEditingUser(u);
    setUserForm({
      mssv: u.mssv,
      ho_ten: u.ho_ten || '',
      email: u.email || '',
      password: '',
      role: u.role || 'sinh_vien',
      so_dien_thoai: u.so_dien_thoai || '',
      lop: u.lop || '',
      khoa: u.khoa || '',
    });
    setUserModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser && (!userForm.mssv || !userForm.password)) {
      Alert.alert('Thiếu thông tin', 'MSSV và mật khẩu là bắt buộc.');
      return;
    }
    try {
      if (editingUser) {
        const res = await apiAdminUpdateUser(editingUser.id, userForm);
        if (res && res.success) {
          Alert.alert('Thành công', 'Đã cập nhật thông tin người dùng.');
          setUserModalVisible(false);
          loadData();
        } else {
          Alert.alert('Lỗi', res?.message || 'Không thể cập nhật.');
        }
      } else {
        const res = await apiAdminCreateUser(userForm);
        if (res && res.success) {
          Alert.alert('Thành công', 'Đã tạo tài khoản mới.');
          setUserModalVisible(false);
          loadData();
        } else {
          Alert.alert('Lỗi', res?.message || 'Không thể tạo người dùng.');
        }
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu người dùng.');
    }
  };

  const handleDeleteUser = (id: number, mssv: string) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa tài khoản MSSV: ${mssv}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          const res = await apiAdminDeleteUser(id);
          if (res && res.success) {
            Alert.alert('Thành công', 'Đã xóa tài khoản.');
            loadData();
          } else {
            Alert.alert('Lỗi', res?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  // ─── NOTIFICATION ACTIONS ────────────────────────────────────────────────
  const handleCreateNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.content.trim()) {
      Alert.alert('Thiếu thông tin', 'Tiêu đề và nội dung thông báo là bắt buộc.');
      return;
    }
    try {
      const res = await apiAdminCreateNotification(notifForm);
      if (res && res.success) {
        Alert.alert('Thành công', 'Đã phát thông báo mới.');
        setNotifModalVisible(false);
        setNotifForm({ title: '', content: '', type: 'info', sender: 'Phòng Đào Tạo' });
        loadData();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể đăng thông báo.');
      }
    } catch {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng thông báo.');
    }
  };

  const handleDeleteNotification = (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const res = await apiAdminDeleteNotification(id);
          if (res && res.success) {
            loadData();
          }
        },
      },
    ]);
  };

  // ─── FEEDBACK ACTIONS ────────────────────────────────────────────────────
  const handleDeleteFeedback = (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa phản hồi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const res = await apiAdminDeleteFeedback(id);
          if (res && res.success) loadData();
        },
      },
    ]);
  };

  // ─── SOS ACTIONS ─────────────────────────────────────────────────────────
  const handleDeleteSos = (id: number) => {
    Alert.alert('Xác nhận', 'Đánh dấu đã xử lý và xóa cảnh báo SOS này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đã xử lý & Xóa',
        style: 'destructive',
        onPress: async () => {
          const res = await apiAdminDeleteSos(id);
          if (res && res.success) loadData();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />

      <NavHeader
        title="Quản trị hệ thống"
        subtitle="Admin Management Portal"
        showBack={true}
        onBack={() => router.back()}
      />

      {/* Tabs Bar */}
      <View style={{ backgroundColor: AppColors.cardBg, borderBottomWidth: 1, borderColor: AppColors.cardBorder }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
          {[
            { key: 'stats', label: 'Tổng quan', icon: 'pie-chart' },
            { key: 'users', label: 'Sinh viên', icon: 'users' },
            { key: 'notifications', label: 'Thông báo', icon: 'bell' },
            { key: 'feedback', label: 'Phản hồi', icon: 'message-square' },
            { key: 'sos', label: 'Cảnh báo SOS', icon: 'alert-triangle' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as TabType)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isActive ? AppColors.primary : AppColors.muted,
                }}
              >
                <Feather name={tab.icon as any} size={15} color={isActive ? '#FFFFFF' : AppColors.textSecondary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? '#FFFFFF' : AppColors.textSecondary }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={{ marginTop: 12, color: AppColors.textSecondary, fontSize: 13 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
        >
          {/* ─── TAB 1: TỔNG QUAN STATS ──────────────────────────────────── */}
          {activeTab === 'stats' && (
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { label: 'Tổng người dùng', value: stats.totalUsers, icon: 'users', color: '#3B82F6', bg: '#EFF6FF' },
                  { label: 'Sinh viên', value: stats.totalStudents, icon: 'user-check', color: '#10B981', bg: '#ECFDF5' },
                  { label: 'Thông báo', value: stats.totalNotifications, icon: 'bell', color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Phản hồi', value: stats.totalFeedback, icon: 'message-circle', color: '#8B5CF6', bg: '#F5F3FF' },
                  { label: 'Cảnh báo SOS', value: stats.totalSosAlerts, icon: 'alert-triangle', color: '#EF4444', bg: '#FEF2F2' },
                  { label: 'Dữ liệu điểm', value: stats.totalGrades, icon: 'award', color: '#06B6D4', bg: '#ECFEFF' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: '48%',
                      backgroundColor: AppColors.cardBg,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: AppColors.cardBorder,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: AppColors.text }}>{item.value}</Text>
                      <Text style={{ fontSize: 11, color: AppColors.textSecondary, fontWeight: '600', marginTop: 2 }}>{item.label}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* SOS mới nhất */}
              {recentSos.length > 0 && (
                <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FEE2E2' }}>
                  <View style={[s.row, { gap: 8, marginBottom: 12 }]}>
                    <Feather name="alert-circle" size={18} color="#DC2626" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#DC2626' }}>Cảnh báo SOS cần xử lý gấp</Text>
                  </View>
                  {recentSos.map((sos, i) => (
                    <View key={i} style={{ paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderColor: '#FECACA' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.text }}>MSSV: {sos.mssv} - Vị trí: {sos.location || 'Chưa định vị'}</Text>
                      <Text style={{ fontSize: 12, color: AppColors.textSecondary, marginTop: 2 }}>{sos.message || 'Yêu cầu trợ giúp khẩn cấp'}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Phản hồi mới nhất */}
              {recentFeedback.length > 0 && (
                <View style={{ backgroundColor: AppColors.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.cardBorder }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: AppColors.text, marginBottom: 12 }}>Ý kiến phản hồi gần đây</Text>
                  {recentFeedback.map((fb, i) => (
                    <View key={i} style={{ paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderColor: AppColors.cardBorder }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.text }}>{fb.title}</Text>
                      <Text style={{ fontSize: 12, color: AppColors.textSecondary, marginTop: 2 }} numberOfLines={2}>{fb.content}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ─── TAB 2: QUẢN LÝ SINH VIÊN ────────────────────────────────── */}
          {activeTab === 'users' && (
            <View style={{ gap: 14 }}>
              {/* Thanh tìm kiếm và nút tạo mới */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, backgroundColor: AppColors.cardBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                  <Feather name="search" size={16} color={AppColors.textMuted} />
                  <TextInput
                    placeholder="Tìm theo tên, MSSV, lớp..."
                    placeholderTextColor={AppColors.textMuted}
                    value={searchUser}
                    onChangeText={setSearchUser}
                    onSubmitEditing={loadData}
                    style={{ flex: 1, marginLeft: 8, fontSize: 13, color: AppColors.text }}
                  />
                  {searchUser.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchUser(''); loadData(); }}>
                      <Feather name="x" size={16} color={AppColors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={openCreateUserModal}
                  activeOpacity={0.8}
                  style={{ height: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: AppColors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Feather name="user-plus" size={16} color="#FFFFFF" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: "#FFFFFF" }}>Thêm</Text>
                </TouchableOpacity>
              </View>

              {/* Danh sách người dùng */}
              {users.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Feather name="inbox" size={40} color={AppColors.textMuted} />
                  <Text style={{ marginTop: 12, fontSize: 14, color: AppColors.textMuted }}>Không tìm thấy người dùng phù hợp.</Text>
                </View>
              ) : (
                users.map((u) => (
                  <View
                    key={u.id}
                    style={{
                      backgroundColor: AppColors.cardBg,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: AppColors.cardBorder,
                      gap: 8,
                    }}
                  >
                    <View style={[s.row, s.between]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: AppColors.text }}>{u.ho_ten}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.primary, marginTop: 2 }}>MSSV: {u.mssv}</Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: u.role === 'admin' ? '#FEF2F2' : '#EEF2FF',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: u.role === 'admin' ? '#DC2626' : AppColors.primary }}>
                          {u.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, color: AppColors.textSecondary }}>Lớp: {u.lop || 'Chưa cập nhật'} • Khoa: {u.khoa || 'Chưa cập nhật'}</Text>
                    <Text style={{ fontSize: 12, color: AppColors.textMuted }}>Email: {u.email || 'Chưa cập nhật'} • SĐT: {u.so_dien_thoai || 'Chưa cập nhật'}</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6, borderTopWidth: 1, borderColor: AppColors.cardBorder, paddingTop: 10 }}>
                      <TouchableOpacity
                        onPress={() => openEditUserModal(u)}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                      >
                        <Feather name="edit-2" size={13} color={AppColors.text} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.text }}>Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteUser(u.id, u.mssv)}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#FEF2F2' }}
                      >
                        <Feather name="trash-2" size={13} color="#DC2626" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ─── TAB 3: QUẢN LÝ THÔNG BÁO ────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <View style={{ gap: 14 }}>
              <TouchableOpacity
                onPress={() => setNotifModalVisible(true)}
                activeOpacity={0.8}
                style={{
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: AppColors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Feather name="plus-circle" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Soạn thông báo mới</Text>
              </TouchableOpacity>

              {notifications.map((n) => (
                <View
                  key={n.id}
                  style={{
                    backgroundColor: AppColors.cardBg,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: AppColors.cardBorder,
                    gap: 6,
                  }}
                >
                  <View style={[s.row, s.between]}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: AppColors.text, flex: 1, marginRight: 8 }}>{n.title}</Text>
                    <TouchableOpacity onPress={() => handleDeleteNotification(n.id)}>
                      <Feather name="trash-2" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: AppColors.textSecondary, lineHeight: 18 }}>{n.content}</Text>
                  <View style={[s.row, s.between, { marginTop: 6 }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: AppColors.primary }}>{n.sender || 'Phòng Đào Tạo'}</Text>
                    <Text style={{ fontSize: 11, color: AppColors.textMuted }}>{n.date || ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ─── TAB 4: PHẢN HỒI SINH VIÊN ────────────────────────────────── */}
          {activeTab === 'feedback' && (
            <View style={{ gap: 14 }}>
              {allFeedback.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Feather name="inbox" size={40} color={AppColors.textMuted} />
                  <Text style={{ marginTop: 12, fontSize: 14, color: AppColors.textMuted }}>Chưa có ý kiến phản hồi nào.</Text>
                </View>
              ) : (
                allFeedback.map((fb) => (
                  <View
                    key={fb.id}
                    style={{
                      backgroundColor: AppColors.cardBg,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: AppColors.cardBorder,
                      gap: 8,
                    }}
                  >
                    <View style={[s.row, s.between]}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: AppColors.text, flex: 1 }}>{fb.title}</Text>
                      <TouchableOpacity onPress={() => handleDeleteFeedback(fb.id)}>
                        <Feather name="trash-2" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 13, color: AppColors.textSecondary, lineHeight: 18 }}>{fb.content}</Text>
                    <View style={{ borderTopWidth: 1, borderColor: AppColors.cardBorder, paddingTop: 6 }}>
                      <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                        Người gửi: {fb.ho_ten || fb.mssv || 'Ẩn danh'} • Lớp: {fb.lop || 'N/A'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ─── TAB 5: CẢNH BÁO SOS ─────────────────────────────────────── */}
          {activeTab === 'sos' && (
            <View style={{ gap: 14 }}>
              {allSos.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Feather name="check-circle" size={40} color="#10B981" />
                  <Text style={{ marginTop: 12, fontSize: 14, color: AppColors.textSecondary, fontWeight: '700' }}>Không có cảnh báo khẩn cấp nào!</Text>
                </View>
              ) : (
                allSos.map((alert) => (
                  <View
                    key={alert.id}
                    style={{
                      backgroundColor: '#FEF2F2',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#FEE2E2',
                      gap: 8,
                    }}
                  >
                    <View style={[s.row, s.between]}>
                      <View style={[s.row, { gap: 8 }]}>
                        <Feather name="alert-triangle" size={18} color="#DC2626" />
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#DC2626' }}>Cảnh báo SOS khẩn cấp</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteSos(alert.id)}>
                        <Feather name="check" size={20} color="#059669" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: AppColors.text }}>
                      Sinh viên: {alert.ho_ten || alert.mssv} (MSSV: {alert.mssv})
                    </Text>
                    <Text style={{ fontSize: 13, color: '#991B1B' }}>Vị trí: {alert.location || 'Chưa định vị'}</Text>
                    <Text style={{ fontSize: 12, color: AppColors.textSecondary }}>Tin nhắn: {alert.message || 'Không có tin nhắn'}</Text>
                    <Text style={{ fontSize: 11, color: AppColors.textMuted }}>SĐT liên hệ: {alert.so_dien_thoai || 'Chưa cập nhật'}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── MODAL TẠO/SỬA NGƯỜI DÙNG ──────────────────────────────────── */}
      {userModalVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 999, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => setUserModalVisible(false)} style={{ flex: 1 }} />
          <View style={{ backgroundColor: AppColors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
            <View style={[s.row, s.between, { marginBottom: 16 }]}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: AppColors.text }}>
                {editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm người dùng mới'}
              </Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Feather name="x" size={20} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Mã số sinh viên (MSSV)*</Text>
              <TextInput
                value={userForm.mssv}
                editable={!editingUser}
                onChangeText={(t) => setUserForm((f) => ({ ...f, mssv: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text, backgroundColor: editingUser ? AppColors.muted : 'transparent' }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Họ và tên*</Text>
              <TextInput
                value={userForm.ho_ten}
                onChangeText={(t) => setUserForm((f) => ({ ...f, ho_ten: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Email</Text>
              <TextInput
                value={userForm.email}
                onChangeText={(t) => setUserForm((f) => ({ ...f, email: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>
                {editingUser ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu khởi tạo*'}
              </Text>
              <TextInput
                value={userForm.password}
                secureTextEntry
                placeholder={editingUser ? '••••••' : 'Nhập mật khẩu'}
                placeholderTextColor={AppColors.textMuted}
                onChangeText={(t) => setUserForm((f) => ({ ...f, password: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Vai trò (Role)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {['sinh_vien', 'admin'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setUserForm((f) => ({ ...f, role: r }))}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: userForm.role === r ? AppColors.primary : AppColors.muted,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: userForm.role === r ? '#FFFFFF' : AppColors.textSecondary }}>
                      {r === 'admin' ? 'Quản trị viên (Admin)' : 'Sinh viên'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Số điện thoại</Text>
              <TextInput
                value={userForm.so_dien_thoai}
                onChangeText={(t) => setUserForm((f) => ({ ...f, so_dien_thoai: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Lớp</Text>
              <TextInput
                value={userForm.lop}
                onChangeText={(t) => setUserForm((f) => ({ ...f, lop: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Khoa</Text>
              <TextInput
                value={userForm.khoa}
                onChangeText={(t) => setUserForm((f) => ({ ...f, khoa: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 20, color: AppColors.text }}
              />

              <TouchableOpacity
                onPress={handleSaveUser}
                activeOpacity={0.8}
                style={{ height: 46, borderRadius: 14, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Lưu thông tin</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ─── MODAL SOẠN THÔNG BÁO ───────────────────────────────────────── */}
      {notifModalVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 999, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => setNotifModalVisible(false)} style={{ flex: 1 }} />
          <View style={{ backgroundColor: AppColors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' }}>
            <View style={[s.row, s.between, { marginBottom: 16 }]}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: AppColors.text }}>Soạn thông báo mới</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Feather name="x" size={20} color={AppColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Tiêu đề thông báo*</Text>
              <TextInput
                value={notifForm.title}
                placeholder="Nhập tiêu đề thông báo"
                placeholderTextColor={AppColors.textMuted}
                onChangeText={(t) => setNotifForm((f) => ({ ...f, title: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Người phát / Đơn vị gửi</Text>
              <TextInput
                value={notifForm.sender}
                placeholder="Phòng Đào Tạo, Ban Giám Hiệu..."
                placeholderTextColor={AppColors.textMuted}
                onChangeText={(t) => setNotifForm((f) => ({ ...f, sender: t }))}
                style={{ height: 42, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, paddingHorizontal: 12, marginBottom: 12, color: AppColors.text }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 }}>Nội dung thông báo*</Text>
              <TextInput
                value={notifForm.content}
                multiline
                numberOfLines={4}
                placeholder="Nội dung chi tiết thông báo gửi đến sinh viên..."
                placeholderTextColor={AppColors.textMuted}
                onChangeText={(t) => setNotifForm((f) => ({ ...f, content: t }))}
                style={{ height: 90, borderRadius: 12, borderWidth: 1, borderColor: AppColors.cardBorder, padding: 12, marginBottom: 20, color: AppColors.text, textAlignVertical: 'top' }}
              />

              <TouchableOpacity
                onPress={handleCreateNotification}
                activeOpacity={0.8}
                style={{ height: 46, borderRadius: 14, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Đăng thông báo ngay</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
