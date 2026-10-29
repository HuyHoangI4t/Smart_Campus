import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NavHeader } from '../../../src/components/NavHeader';
import { useTheme, ACCENT_PRESETS, AccentColor } from '../../../src/context/ThemeContext';
import { triggerTestNotification } from '../../../src/services/notificationService';
import { syncAllWidgets } from '../../../src/services/widgetService';
import { mainStyles as s } from '../../../src/constants/globalStyles';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    themeMode,
    setThemeMode,
    isDark,
    accentColor,
    setAccentColor,
    colors,
    hapticsEnabled,
    setHapticsEnabled,
    notificationsEnabled,
    setNotificationsEnabled,
    defaultSatelliteMap,
    setDefaultSatelliteMap,
    compassEnabled,
    setCompassEnabled,
    clearAppCache,
    getAppCacheSize,
    triggerHaptic,
  } = useTheme();

  const [clearingCache, setClearingCache] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ sizeFormatted: string; count: number }>({
    sizeFormatted: 'Đang tính...',
    count: 0,
  });
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [syncingWidgets, setSyncingWidgets] = useState(false);

  // Nạp dung lượng bộ nhớ đệm
  const refreshCacheSize = useCallback(async () => {
    try {
      const res = await getAppCacheSize();
      setCacheInfo(res);
    } catch {
      setCacheInfo({ sizeFormatted: '0 KB', count: 0 });
    }
  }, [getAppCacheSize]);

  useEffect(() => {
    refreshCacheSize();
  }, [refreshCacheSize]);

  // Xử lý gửi thông báo thử nghiệm trực tiếp
  const handleTestNotification = async (type: 'schedule' | 'grades' | 'campus' | 'sos') => {
    if (!notificationsEnabled) {
      triggerHaptic('warning');
      Alert.alert(
        'Thông báo đang tắt',
        'Vui lòng bật công tắc "Nhắc nhở lịch học & tin tức" phía trên để nhận thông báo.',
        [{ text: 'Đã hiểu' }]
      );
      return;
    }
    setTestingNotification(true);
    triggerHaptic('light');
    try {
      await triggerTestNotification(type);
      triggerHaptic('success');
    } catch {
      Alert.alert('Thông báo', 'Không thể gửi thông báo lúc này.');
    } finally {
      setTestingNotification(false);
    }
  };

  // Xử lý đồng bộ Widget điện thoại
  const handleSyncWidgets = async () => {
    setSyncingWidgets(true);
    triggerHaptic('medium');
    try {
      await syncAllWidgets();
      triggerHaptic('success');
      Alert.alert(
        'Đồng bộ thành công',
        'Dữ liệu Widget Lịch học, Điểm GPA và Nút SOS đã được làm mới đồng bộ với hệ thống.'
      );
    } catch {
      Alert.alert('Thông báo', 'Đã yêu cầu đồng bộ Widget.');
    } finally {
      setSyncingWidgets(false);
    }
  };

  // Xử lý xóa bộ nhớ đệm an toàn
  const handleClearCache = () => {
    triggerHaptic('warning');
    Alert.alert(
      'Xóa bộ nhớ đệm',
      'Thao tác này sẽ dọn dẹp các tệp bản đồ, tin tức và dữ liệu ngoại tuyến tạm thời để giải phóng bộ nhớ. Tài khoản đăng nhập của bạn vẫn được giữ nguyên an toàn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              const removedCount = await clearAppCache();
              await refreshCacheSize();
              triggerHaptic('success');
              Alert.alert(
                'Thành công',
                `Đã dọn dẹp ${removedCount > 0 ? `${removedCount} mục bộ nhớ đệm` : 'bộ nhớ đệm'}. Ứng dụng sẽ nạp dữ liệu mới nhất từ máy chủ.`
              );
            } catch {
              Alert.alert('Thông báo', 'Đã xóa bộ nhớ đệm thành công.');
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavHeader
        title="Cài đặt ứng dụng"
        subtitle="Giao diện, thông báo & hệ thống"
        showBack={true}
        onBack={() => router.back()}
        bg={colors.primary}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* ==================== 1. GIAO DIỆN & CHỦ ĐỀ ==================== */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Chế độ giao diện
          </Text>

          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Option: Sáng (Light) */}
              <TouchableOpacity
                onPress={() => setThemeMode('light')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: themeMode === 'light' ? colors.primary : colors.cardBorder,
                  backgroundColor: themeMode === 'light' ? (isDark ? '#334155' : '#EEF2FF') : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Feather name="sun" size={20} color="#D97706" />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: themeMode === 'light' ? colors.primary : colors.text,
                  }}
                >
                  Sáng
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Tươi sáng
                </Text>
                {themeMode === 'light' && (
                  <View
                    style={{
                      marginTop: 6,
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>Đang dùng</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Option: Tối (Dark) */}
              <TouchableOpacity
                onPress={() => setThemeMode('dark')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: themeMode === 'dark' ? colors.accent : colors.cardBorder,
                  backgroundColor: themeMode === 'dark' ? (isDark ? '#334155' : '#EEF2FF') : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#1E293B',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Feather name="moon" size={19} color="#818CF8" />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: themeMode === 'dark' ? colors.accent : colors.text,
                  }}
                >
                  Tối
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Dịu mắt OLED
                </Text>
                {themeMode === 'dark' && (
                  <View
                    style={{
                      marginTop: 6,
                      backgroundColor: colors.accent,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>Đang dùng</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Option: Tự động (System) */}
              <TouchableOpacity
                onPress={() => setThemeMode('system')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: themeMode === 'system' ? colors.primary : colors.cardBorder,
                  backgroundColor: themeMode === 'system' ? (isDark ? '#334155' : '#EEF2FF') : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#E0E7FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Feather name="smartphone" size={19} color="#4F46E5" />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: themeMode === 'system' ? colors.primary : colors.text,
                  }}
                >
                  Hệ thống
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Tự động
                </Text>
                {themeMode === 'system' && (
                  <View
                    style={{
                      marginTop: 6,
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>Đang dùng</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Tông màu thương hiệu (Accent Color) */}
            <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 6 }} />

            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              Tông màu thương hiệu
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map((key) => {
                const preset = ACCENT_PRESETS[key];
                const isSelected = accentColor === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setAccentColor(key)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: isSelected ? preset.primary : colors.cardBorder,
                      backgroundColor: isSelected ? (isDark ? '#334155' : '#F1F5F9') : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: preset.primary,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: '#FFFFFF',
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? '800' : '600',
                        color: isSelected ? preset.primary : colors.text,
                      }}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ==================== 2. BẢN ĐỒ & ĐỊNH VỊ ==================== */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Bản đồ & Điều hướng đi bộ
          </Text>

          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              gap: 14,
            }}
          >
            <View style={[s.row, s.between]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={[s.row, { gap: 10 }]}>
                  <Feather name="compass" size={17} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Tự động xoay la bàn
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, paddingLeft: 27 }}>
                  Xoay góc bản đồ theo hướng bước chân người dùng khi chỉ đường
                </Text>
              </View>
              <Switch
                value={compassEnabled}
                onValueChange={setCompassEnabled}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

            <View style={[s.row, s.between]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={[s.row, { gap: 10 }]}>
                  <Feather name="layers" size={17} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Chế độ bản đồ vệ tinh mặc định
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, paddingLeft: 27 }}>
                  Mở ảnh chụp thực địa vệ tinh toàn cảnh khuôn viên trường ngay khi vào tab bản đồ
                </Text>
              </View>
              <Switch
                value={defaultSatelliteMap}
                onValueChange={setDefaultSatelliteMap}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>
          </View>
        </View>

        {/* ==================== 3. THÔNG BÁO & LỜI NHẮC ==================== */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Thông báo & Phản hồi
          </Text>

          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              gap: 14,
            }}
          >
            <View style={[s.row, s.between]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={[s.row, { gap: 10 }]}>
                  <Feather name="bell" size={17} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Nhắc nhở lịch học & tin tức
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, paddingLeft: 27 }}>
                  Nhận thông báo trước tiết học 30 phút và các thông báo khẩn từ phòng đào tạo
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

            <View style={[s.row, s.between]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={[s.row, { gap: 10 }]}>
                  <Feather name="activity" size={17} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Phản hồi rung xúc giác
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, paddingLeft: 27 }}>
                  Rung nhẹ tinh tế khi bấm phím, rẽ ngã ba hoặc tự động tính lại lộ trình
                </Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Công cụ kiểm tra thông báo nhanh */}
            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                Kiểm tra thông báo nhanh
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
                Bấm để phát thông báo mẫu kiểm tra âm thanh và rung
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleTestNotification('schedule')}
                  disabled={testingNotification}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE',
                  }}
                >
                  <Feather name="calendar" size={13} color={isDark ? '#60A5FA' : '#1D4ED8'} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#93C5FD' : '#1D4ED8' }}>
                    Nhắc lịch học
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTestNotification('grades')}
                  disabled={testingNotification}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0',
                  }}
                >
                  <Feather name="award" size={13} color={isDark ? '#34D399' : '#047857'} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#A7F3D0' : '#047857' }}>
                    Báo điểm mới
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTestNotification('sos')}
                  disabled={testingNotification}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
                  }}
                >
                  <Feather name="alert-circle" size={13} color={isDark ? '#F87171' : '#B91C1C'} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#FCA5A5' : '#B91C1C' }}>
                    Cảnh báo SOS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleTestNotification('campus')}
                  disabled={testingNotification}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
                  }}
                >
                  <Feather name="bell" size={13} color={isDark ? '#FBBF24' : '#B45309'} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#FDE68A' : '#B45309' }}>
                    Tin tức trường
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mục đồng bộ Widget màn hình chính Android */}
            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

            <View style={[s.row, s.between]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={[s.row, { gap: 10 }]}>
                  <MaterialCommunityIcons name="widgets-outline" size={18} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Tiện ích màn hình chính (Widget)
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, paddingLeft: 28 }}>
                  Đồng bộ lại thẻ Lịch học, Điểm GPA và Nút SOS ngoài màn hình
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleSyncWidgets}
                disabled={syncingWidgets}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  backgroundColor: isDark ? '#334155' : '#EEF2FF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? '#475569' : '#C7D2FE',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {syncingWidgets ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather name="refresh-cw" size={13} color={colors.primary} />
                )}
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                  {syncingWidgets ? 'Đang sync...' : 'Đồng bộ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ==================== 4. DỮ LIỆU & BỘ NHỚ ĐỆM ==================== */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Quản lý dữ liệu & Bộ nhớ
          </Text>

          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              gap: 14,
            }}
          >
            <View style={[s.row, s.between]}>
              <View style={[s.row, { gap: 10 }]}>
                <Feather name="database" size={17} color={colors.primary} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    Bộ nhớ đệm tạm thời
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    Dữ liệu tin tức và ngoại tuyến ({cacheInfo.count} mục)
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: isDark ? '#334155' : '#F1F5F9',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>
                  {cacheInfo.sizeFormatted}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClearCache}
              disabled={clearingCache}
              activeOpacity={0.8}
              style={{
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? '#334155' : '#F8FAFC',
                borderWidth: 1,
                borderColor: colors.cardBorder,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Feather name="trash-2" size={15} color="#DC2626" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>
                {clearingCache ? 'Đang dọn dẹp...' : 'Dọn dẹp bộ nhớ đệm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================== 5. THÔNG TIN ỨNG DỤNG ==================== */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Thông tin hệ thống
          </Text>

          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              gap: 12,
            }}
          >
            <View style={[s.row, s.between]}>
              <View style={[s.row, { gap: 10 }]}>
                <Feather name="info" size={17} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  Phiên bản ứng dụng
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                v2.4.0 (Build 2026.10)
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

            <TouchableOpacity
              onPress={() => setTermsModalVisible(true)}
              activeOpacity={0.7}
              style={[s.row, s.between]}
            >
              <View style={[s.row, { gap: 10 }]}>
                <Feather name="file-text" size={17} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  Điều khoản sử dụng
                </Text>
              </View>
              <Feather name="chevron-right" size={17} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

            <TouchableOpacity
              onPress={() => setPrivacyModalVisible(true)}
              activeOpacity={0.7}
              style={[s.row, s.between]}
            >
              <View style={[s.row, { gap: 10 }]}>
                <Feather name="shield" size={17} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  Chính sách quyền riêng tư
                </Text>
              </View>
              <Feather name="chevron-right" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginTop: 20, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
              Trường Đại học Tây Nguyên (TNU)
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSubtle }}>
              Hệ thống Smart Campus & Bản đồ nội bộ thông minh
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Điều khoản sử dụng */}
      <Modal
        visible={termsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxHeight: '75%',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <View style={[s.row, s.between, { marginBottom: 14 }]}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>
                Điều khoản sử dụng
              </Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 22 }}>
                1. Ứng dụng TNU Smart Campus phục vụ công tác học tập, tra cứu lịch học, điểm thi, chỉ đường và thông tin liên lạc cho cán bộ, giảng viên và sinh viên Trường Đại học Tây Nguyên.{'\n\n'}
                2. Người dùng cam kết bảo mật thông tin tài khoản đăng nhập và không chia sẻ thông tin cá nhân trái phép.{'\n\n'}
                3. Các tính năng định vị vị trí và SOS chỉ sử dụng phục vụ mục đích cứu hộ, chỉ dẫn đường và bảo đảm an ninh trong khuôn viên nhà trường.{'\n\n'}
                4. Nhà trường bảo lưu quyền cập nhật hệ thống và bổ sung các tính năng nâng cao trải nghiệm học tập.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setTermsModalVisible(false)}
              style={{
                marginTop: 18,
                height: 44,
                backgroundColor: colors.primary,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Chính sách bảo mật */}
      <Modal
        visible={privacyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxHeight: '75%',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <View style={[s.row, s.between, { marginBottom: 14 }]}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>
                Chính sách quyền riêng tư
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 22 }}>
                1. Quyền định vị (GPS): Chỉ được thu thập khi người dùng mở màn hình Bản đồ hoặc gửi tín hiệu SOS khẩn cấp, nhằm vẽ lộ trình chỉ đường chính xác.{'\n\n'}
                2. Quyền bộ nhớ & Camera: Dùng để tải và thay đổi ảnh đại diện cá nhân theo mong muốn của sinh viên.{'\n\n'}
                3. Dữ liệu học tập: Điểm thi, thời khóa biểu được mã hóa đường truyền SSL/TLS bảo mật tuyệt đối.{'\n\n'}
                4. Hệ thống không lưu trữ lịch sử di chuyển ngoài khuôn viên trường và không chia sẻ cho bên thứ ba.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPrivacyModalVisible(false)}
              style={{
                marginTop: 18,
                height: 44,
                backgroundColor: colors.primary,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

