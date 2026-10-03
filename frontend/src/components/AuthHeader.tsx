import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '@/src/constants/appColors';
import { authStyles } from '@/src/constants/globalStyles';

interface AuthHeaderProps {
  currentTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
  isKeyboardVisible?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ 
  currentTab, 
  onTabChange, 
  isKeyboardVisible = false 
}) => {
  const [tabWidth, setTabWidth] = useState(0);
  const insets = useSafeAreaInsets(); // Lấy chiều cao vùng tai thỏ / notch

  const onTabLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width - 8;
    setTabWidth(width);
  };

  return (
    <View>
      {/* ================= HEADER ẢNH & CHỮ ================= */}
      <View 
        style={[
          authStyles.headerContainer, 
          isKeyboardVisible && { 
            height: 'auto', 
            paddingTop: insets.top + 8, // Tự động đẩy xuống dưới tai thỏ
            paddingBottom: 4
          }
        ]}
      >
        {/* Ẩn Ảnh & Gradient khi mở bàn phím */}
        {!isKeyboardVisible && (
          <>
            <Image
              source={require('@/assets/images/images.jpg')}
              style={authStyles.headerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                'rgba(19, 47, 115, 0.45)',
                'rgba(19, 47, 115, 0.70)',
                'rgba(243, 246, 253, 0.88)',
                AppColors.background,
              ]}
              locations={[0.0, 0.45, 0.8, 1.0]}
              style={authStyles.gradientOverlay}
            />
          </>
        )}

        {/* GIỮ LẠI LOGO & DÒNG CHỮ */}
        <View 
          style={[
            authStyles.brandContainer, 
            isKeyboardVisible && { 
              position: 'relative', 
              bottom: 0, 
              paddingBottom: 4 
            }
          ]}
        >
          <View style={authStyles.brandRow}>
            <View style={authStyles.logoBox}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[authStyles.brandTitle, isKeyboardVisible && { color: AppColors.primary || '#132F73' }]}>
              Smart Campus
            </Text>
          </View>
          <Text style={[authStyles.brandSubtitle, isKeyboardVisible && { color: AppColors.textMuted }]}>
            Cổng Thông Tin Sinh Viên Thông Minh
          </Text>
        </View>
      </View>

      {/* ================= TAB CHUYỂN ĐỔI ================= */}
      <View style={[authStyles.tabOuterPadding, isKeyboardVisible && { paddingTop: 6, paddingBottom: 6 }]}>
        <View style={authStyles.tabTrack} onLayout={onTabLayout}>
          {tabWidth > 0 && (
            <View
              style={[
                authStyles.tabIndicator,
                {
                  width: tabWidth / 2,
                  transform: [
                    { translateX: currentTab === 'login' ? 0 : tabWidth / 2 },
                  ],
                },
              ]}
            />
          )}

          <TouchableOpacity
            style={authStyles.tabItem}
            onPress={() => onTabChange('login')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                authStyles.tabLabel,
                currentTab === 'login'
                  ? authStyles.tabLabelActive
                  : authStyles.tabLabelInactive,
              ]}
            >
              Đăng Nhập
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={authStyles.tabItem}
            onPress={() => onTabChange('register')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                authStyles.tabLabel,
                currentTab === 'register'
                  ? authStyles.tabLabelActive
                  : authStyles.tabLabelInactive,
              ]}
            >
              Đăng Ký
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};