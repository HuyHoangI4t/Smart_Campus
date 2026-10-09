import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../constants/appColors';
import { commonStyles } from '../styles/common.styles';
import { getHeaderTopPadding } from '../utils/safeArea';

export interface NavHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightIcon?: any;
  onRight?: () => void;
  rightElement?: React.ReactNode;
  bg?: string;
  backgroundColor?: string;
  titleColor?: string;
  children?: React.ReactNode;
}

export function NavHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  rightIcon,
  onRight,
  rightElement,
  bg,
  backgroundColor,
  titleColor = '#FFFFFF',
  children,
}: NavHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const shouldShowBack = showBack || !!onBack;
  const headerBg = bg || backgroundColor || AppColors.primary;
  const paddingTop = getHeaderTopPadding(insets.top, 14);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent />
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop,
          paddingBottom: 16,
          backgroundColor: headerBg,
          zIndex: 10,
        }}
      >
      <View style={[commonStyles.row, { gap: 12, marginBottom: children ? 12 : 0 }]}>
        {shouldShowBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={commonStyles.iconBtnGlass}
          >
            <Feather name="arrow-left" size={18} color={titleColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 4 }} />
        )}

        <View style={{ flex: 1 }}>
          <Text style={[commonStyles.screenTitle, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[commonStyles.screenSubtitle, { color: titleColor + 'D0' }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightElement ? (
          rightElement
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRight}
            activeOpacity={0.7}
            style={commonStyles.iconBtnGlass}
          >
            <Feather name={rightIcon} size={18} color={titleColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 8 }} />
        )}
      </View>
      {children}
    </View>
    </>
  );
}

export default NavHeader;
