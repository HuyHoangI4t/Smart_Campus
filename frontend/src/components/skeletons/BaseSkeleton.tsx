import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, DimensionValue } from "react-native";

export interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

/**
 * Thành phần Skeleton cơ bản với hiệu ứng nhịp thở (pulse animation)
 * Tối ưu hiệu năng 60 FPS bằng Animated.loop với useNativeDriver: true
 */
export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
  backgroundColor = "#E2E8F0",
}: SkeletonBoxProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

