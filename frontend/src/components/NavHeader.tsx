import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
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
  blur?: boolean;
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
  blur = false,
}: NavHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const shouldShowBack = showBack || !!onBack;
  const headerBg = blur ? 'transparent' : (bg || backgroundColor || colors.primary);
  const paddingTop = getHeaderTopPadding(insets.top, 14);
  const effectiveTitleColor = titleColor !== '#FFFFFF' ? titleColor : (blur ? (isDark ? '#FFFFFF' : colors.text) : '#FFFFFF');
  const effectiveSubtitleColor = blur ? (isDark ? 'rgba(255, 255, 255, 0.72)' : colors.textSecondary) : (titleColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.76)' : colors.textMuted);
  const effectivePreTitleColor = blur ? (isDark ? 'rgba(255, 255, 255, 0.6)' : colors.primary) : 'rgba(255, 255, 255, 0.72)';
  const backBtnBg = blur ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)') : 'rgba(255, 255, 255, 0.16)';
  const backBtnBorder = blur ? (isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)') : 'rgba(255, 255, 255, 0.22)';

  return (
    <>
      <StatusBar barStyle={blur && !isDark ? 'dark-content' : 'light-content'} backgroundColor={blur ? 'transparent' : headerBg} translucent={Platform.OS === 'android'} />
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop,
          paddingBottom: children ? 12 : 16,
          backgroundColor: headerBg,
          zIndex: 10,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.cardBorder : 'rgba(255, 255, 255, 0.08)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 6,
          overflow: 'hidden',
        }}
      >
        {blur && (
          <BlurView
            intensity={Platform.OS === 'ios' ? 80 : 90}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.85)',
              },
            ]}
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: children ? 12 : 0 }}>
          {shouldShowBack ? (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                backgroundColor: backBtnBg,
                borderWidth: 1,
                borderColor: backBtnBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="arrow-left" size={19} color={effectiveTitleColor} />
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
                  color: effectivePreTitleColor,
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
                color: effectiveTitleColor,
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
                  color: effectiveSubtitleColor,
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Tác vụ"
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                backgroundColor: backBtnBg,
                borderWidth: 1,
                borderColor: backBtnBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name={rightIcon} size={18} color={effectiveTitleColor} />
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
