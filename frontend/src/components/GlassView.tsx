import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  elevation?: number;
  tint?: 'light' | 'dark' | 'default';
}

/**
 * GlassView - Thành phần container kính mờ Frosted Glass chuẩn hoá
 * Tự động tạo hiệu ứng làm mờ (Blur), viền sáng phản chiếu ánh sáng (Specular Rim)
 * và tương thích mượt mà trên cả iOS, Android và Web.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity,
  borderRadius = 22,
  borderWidth = 1.2,
  borderColor,
  backgroundColor,
  elevation = 3,
  tint,
}) => {
  const { isDark } = useTheme();

  const finalBorderColor =
    borderColor ||
    (isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.82)');

  const finalBg =
    backgroundColor ||
    (isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.72)');

  const finalIntensity =
    intensity ?? (Platform.OS === 'ios' ? 75 : 90);

  const finalTint = tint || (isDark ? 'dark' : 'light');

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          borderWidth,
          borderColor: finalBorderColor,
          elevation,
          shadowOpacity: isDark ? 0.35 : 0.08,
        },
        style,
      ]}
    >
      {/* Lớp nền kính mờ BlurView */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            overflow: 'hidden',
          },
        ]}
      >
        <BlurView
          intensity={finalIntensity}
          tint={finalTint}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: finalBg,
            },
          ]}
        />
      </View>

      {/* Nội dung bên trong thẻ kính */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    overflow: 'hidden',
  },
});

export default GlassView;

