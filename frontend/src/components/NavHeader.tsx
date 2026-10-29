import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
  const headerBg = bg || backgroundColor || colors.primary;
  const paddingTop = getHeaderTopPadding(insets.top, 14);

  const effectiveTitleColor =
    titleColor !== '#FFFFFF'
      ? titleColor
      : blur
      ? isDark
        ? '#FFFFFF'
        : colors.text
      : '#FFFFFF';

  const effectiveSubtitleColor = blur
    ? isDark
      ? 'rgba(255, 255, 255, 0.72)'
      : colors.textSecondary
    : titleColor === '#FFFFFF'
    ? 'rgba(255, 255, 255, 0.82)'
    : colors.textMuted;

  const effectivePreTitleColor = blur
    ? isDark
      ? 'rgba(255, 255, 255, 0.65)'
      : colors.primary
    : 'rgba(255, 255, 255, 0.78)';

  const backBtnBg = blur
    ? isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.05)'
    : 'rgba(255, 255, 255, 0.18)';

  const backBtnBorder = blur
    ? isDark
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(0, 0, 0, 0.08)'
    : 'rgba(255, 255, 255, 0.28)';

  const gradientColors: [string, string, ...string[]] = isDark
    ? ['#1E293B', '#0F172A']
    : [headerBg, '#1E40AF'];

  const content = (
    <>
      {/* Vòng tròn hiệu ứng ánh sáng nền mờ nhẹ */}
      {!blur && (
        <>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </>
      )}

      {blur && (
        <BlurView
          intensity={Platform.OS === 'ios' ? 85 : 95}
          tint={isDark ? 'dark' : 'light'}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.75)'
                : 'rgba(255, 255, 255, 0.78)',
            },
          ]}
        />
      )}

      <View style={styles.headerRow}>
        {/* Nút quay lại */}
        {shouldShowBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={[
              styles.navBtn,
              {
                backgroundColor: backBtnBg,
                borderColor: backBtnBorder,
              },
            ]}
          >
            <Feather name="arrow-left" size={19} color={effectiveTitleColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 4 }} />
        )}

        {/* Cụm Tiêu đề & Phụ đề */}
        <View style={styles.titleContainer}>
          {preTitle ? (
            <Text
              style={[
                styles.preTitleText,
                {
                  color: effectivePreTitleColor,
                },
              ]}
              numberOfLines={1}
            >
              {preTitle}
            </Text>
          ) : null}
          <Text
            style={[
              styles.titleText,
              {
                color: effectiveTitleColor,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitleText,
                {
                  color: effectiveSubtitleColor,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Nút tác vụ bên phải */}
        {rightElement ? (
          rightElement
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRight}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Tác vụ"
            style={[
              styles.navBtn,
              {
                backgroundColor: backBtnBg,
                borderColor: backBtnBorder,
              },
            ]}
          >
            <Feather name={rightIcon} size={18} color={effectiveTitleColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: shouldShowBack ? 4 : 8 }} />
        )}
      </View>
      {children}
    </>
  );

  return (
    <>
      <StatusBar
        barStyle={blur && !isDark ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {blur ? (
        <View
          style={[
            styles.baseContainer,
            {
              paddingTop,
              paddingBottom: children ? 14 : 18,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.baseContainer,
            {
              paddingTop,
              paddingBottom: children ? 14 : 18,
              borderBottomColor: 'rgba(255, 255, 255, 0.12)',
            },
          ]}
        >
          {content}
        </LinearGradient>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderBottomWidth: 1,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  preTitleText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default NavHeader;
