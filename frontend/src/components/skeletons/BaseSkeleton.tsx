import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, DimensionValue } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

/**
 * Thành phần Skeleton cơ bản với hiệu ứng nhịp thở (pulse animation)
 * Tự động thích ứng Dark Mode chuẩn OLED/Slate (#334155 / #E2E8F0)
 * Tối ưu hiệu năng 60 FPS bằng Animated.loop với useNativeDriver: true
 */
export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
  backgroundColor,
}: SkeletonBoxProps) {
  const { isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: isDark ? 0.75 : 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: isDark ? 0.25 : 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim, isDark]);

  const defaultBg = isDark ? "#334155" : "#E2E8F0";
  let resolvedBg = backgroundColor || defaultBg;
  if (isDark && backgroundColor) {
    if (
      backgroundColor === "#CBD5E1" ||
      backgroundColor === "#E2E8F0" ||
      backgroundColor === "#DCE6EE" ||
      backgroundColor === "#EEF2F6" ||
      backgroundColor === "#F1F5F9"
    ) {
      resolvedBg = "#334155";
    }
  }

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: resolvedBg,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}
