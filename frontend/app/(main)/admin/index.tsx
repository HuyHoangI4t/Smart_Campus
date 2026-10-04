import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '../../../src/constants/appColors';
import { NavHeader } from '../../../src/components/NavHeader';

export default function AdminScreen() {
  const router = useRouter();

  const handleOpenWebPortal = () => {
    const url = Platform.OS === 'android' ? 'http://10.0.2.2:5000/portal' : 'http://localhost:5000/portal';
    Linking.openURL(url).catch((err) => {
      console.warn('Không thể mở URL Trang Quản trị:', err);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.background }}>
      <NavHeader
        title="Trang Quản Trị Hệ Thống"
        subtitle="Hệ thống Web độc lập"
        showBack={true}
        onBack={() => router.push('/(main)/home')}
      />

      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: '#EEF2FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: '#C7D2FE',
          }}
        >
          <Feather name="shield" size={40} color={AppColors.primary} />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: '900',
            color: '#0F172A',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Trang Web Quản Trị Dành Riêng Cho Admin
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: '#64748B',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 28,
            maxWidth: 320,
          }}
        >
          Ứng dụng di động chỉ phục vụ dành riêng cho Sinh viên. Toàn bộ tính năng Quản lý người dùng, Thống kê số liệu, Thông báo toàn trường và Xử lý SOS được vận hành trên Trang Web Quản trị trên máy tính.
        </Text>

        <View style={{ width: '100%', gap: 12 }}>
          <TouchableOpacity
            onPress={handleOpenWebPortal}
            activeOpacity={0.8}
            style={{
              backgroundColor: AppColors.primary,
              paddingVertical: 14,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Feather name="external-link" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
              Mở Trang Quản Trị (localhost:5000/portal)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(main)/home')}
            activeOpacity={0.7}
            style={{
              backgroundColor: '#FFFFFF',
              paddingVertical: 14,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Feather name="arrow-left" size={18} color="#475569" />
            <Text style={{ color: '#475569', fontSize: 14, fontWeight: '700' }}>
              Quay lại Trang chủ Sinh viên
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
