import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../constants/appColors';
import { getHeaderTopPadding } from '../utils/safeArea';

export interface NavHeaderProps {
  title: string;
  subtitle?: string;
  preTitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightIcon?: keyof typeof Feather.glyphMap;
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
  preTitle,
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
      <StatusBar barStyle="light-content" backgroundColor={headerBg} translucent={Platform.OS === 'android'} />
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop,
          paddingBottom: children ? 12 : 16,
          backgroundColor: headerBg,
          zIndex: 10,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: children ? 12 : 0 }}>
          {shouldShowBack ? (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.22)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="arrow-left" size={19} color={titleColor} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 2 }} />
          )}

          <View style={{ flex: 1, marginHorizontal: 2 }}>
            {preTitle ? (
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.72)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  marginBottom: 1,
                }}
                numberOfLines={1}
              >
                {preTitle}
              </Text>
            ) : null}
            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: titleColor,
                letterSpacing: 0.1,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: titleColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.76)' : AppColors.textMuted,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
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
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.22)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name={rightIcon} size={18} color={titleColor} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: shouldShowBack ? 2 : 6 }} />
          )}
        </View>
        {children}
      </View>
    </>
  );
}

export default NavHeader;
