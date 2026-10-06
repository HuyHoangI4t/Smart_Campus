import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppColors } from '../constants/appColors';
import { tabBarStyles } from '../constants/globalStyles';

export interface StandaloneNavProps {
  selectedIndex: number;
  onDestinationSelected: (index: number) => void;
}

export type CustomBottomNavProps = BottomTabBarProps | StandaloneNavProps;

interface TabItemConfig {
  route: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TAB_ITEMS: TabItemConfig[] = [
  { route: 'home/index', label: 'Trang chủ', icon: 'home' },
  { route: 'map/index', label: 'Bản đồ', icon: 'location-on' },
  { route: 'schedule/index', label: 'Lịch học', icon: 'calendar-today' },
  { route: 'grades/index', label: 'Kết quả', icon: 'assessment' },
  { route: 'profile/index', label: 'Hồ sơ', icon: 'person-outline' },
];

type TabBarVisibilityListener = (visible: boolean) => void;
const visibilityListeners: Set<TabBarVisibilityListener> = new Set();

export function setTabBarVisible(visible: boolean) {
  visibilityListeners.forEach((listener) => listener(visible));
}

// Khoảng đệm cố định ở đáy trang ScrollView khi thanh nav đang hiển thị
export const BOTTOM_NAV_HEIGHT = 115;

/**
 * Hook lắng nghe cuộn màn hình:
 * - Khi cuộn xuống: thanh nav trượt ẩn xuống dưới, tự động giảm bottomPadding (20px)
 * - Khi kéo ngược lên hoặc về gần đỉnh trang: thanh nav trượt hiện lại vị trí cũ, khôi phục bottomPadding (88px)
 */
export function useTabBarScrollHandler(options?: { visiblePadding?: number; hiddenPadding?: number }) {
  const visiblePad = options?.visiblePadding ?? 88;
  const hiddenPad = options?.hiddenPadding ?? 20;

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastOffsetY = useRef(0);
  const isTabBarVisibleRef = useRef(true);

  const onScroll = useCallback((event: any) => {
    const currentOffsetY = event?.nativeEvent?.contentOffset?.y ?? 0;
    const diff = currentOffsetY - lastOffsetY.current;

    // 1. Khi đang ở gần đỉnh trang (<= 25px), luôn luôn giữ/hiện thanh nav
    if (currentOffsetY <= 25) {
      if (!isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = true;
        setIsNavVisible(true);
        setTabBarVisible(true);
      }
      lastOffsetY.current = Math.max(0, currentOffsetY);
      return;
    }

    // 2. Khi cuộn xuống (diff > 10 và đã cuộn qua một đoạn > 40px): ẩn nav chạy xuống dưới
    if (diff > 10 && currentOffsetY > 40) {
      if (isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = false;
        setIsNavVisible(false);
        setTabBarVisible(false);
      }
    }
    // 3. Khi kéo ngược lên (diff < -10): hiện nav chạy lên vị trí cũ
    else if (diff < -10) {
      if (!isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = true;
        setIsNavVisible(true);
        setTabBarVisible(true);
      }
    }

    lastOffsetY.current = currentOffsetY;
  }, []);

  // Đảm bảo thanh nav hiển thị lại khi unmount màn hình
  useEffect(() => {
    return () => {
      setTabBarVisible(true);
    };
  }, []);

  const bottomPadding = isNavVisible ? visiblePad : hiddenPad;

  return { onScroll, scrollEventThrottle: 16, isNavVisible, bottomPadding };
}

export function CustomBottomNav(props: CustomBottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);
  const hideDistance = 140 + insets.bottom;

  const translateY = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const listener = (visible: boolean) => {
      setIsVisible(visible);
      Animated.timing(translateY, {
        toValue: visible ? 0 : hideDistance,
        duration: 220,
        useNativeDriver: true,
      }).start();
    };
    visibilityListeners.add(listener);
    return () => {
      visibilityListeners.delete(listener);
    };
  }, [hideDistance, translateY]);

  const isTabBarProps = 'state' in props;

  let activeIndex = 0;
  let isSubScreenHidden = false;

  if (isTabBarProps) {
    const currentRoute = props.state.routes[props.state.index];
    const descriptor = (props as BottomTabBarProps).descriptors?.[currentRoute?.key];
    const tabBarStyle: any = descriptor?.options?.tabBarStyle;
    if (tabBarStyle?.display === 'none') {
      isSubScreenHidden = true;
    }

    const matchIndex = TAB_ITEMS.findIndex((t) => t.route === currentRoute?.name);
    // Ẩn tab bar trên các màn hình phụ như feedback, sos, grades_detail, change_password, test
    if (matchIndex === -1) {
      isSubScreenHidden = true;
    } else {
      activeIndex = matchIndex;
    }
  } else {
    activeIndex = props.selectedIndex;
  }

  // Khi chuyển tab, luôn trượt thanh nav lên hiển thị lại
  useEffect(() => {
    setIsVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, translateY]);

  if (isSubScreenHidden) {
    return null;
  }

  const handleSelect = (index: number) => {
    if (isTabBarProps) {
      const targetItem = TAB_ITEMS[index];
      const isSelected = activeIndex === index;
      const event = props.navigation.emit({
        type: 'tabPress',
        target: targetItem.route,
        canPreventDefault: true,
      });

      if (!isSelected && !event.defaultPrevented) {
        props.navigation.navigate(targetItem.route);
      }
    } else {
      props.onDestinationSelected(index);
    }
  };

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        tabBarStyles.container,
        {
          paddingBottom: bottomPadding,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={tabBarStyles.navCard}>
        {TAB_ITEMS.map((item, index) => {
          const isSelected = index === activeIndex;
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleSelect(index)}
              activeOpacity={0.7}
              style={tabBarStyles.tabItem}
            >
              <View
                style={[
                  tabBarStyles.iconContainer,
                  isSelected && tabBarStyles.selectedIconContainer,
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  color={isSelected ? AppColors.primary : AppColors.textMuted}
                />
              </View>
              <Text
                style={[
                  tabBarStyles.label,
                  {
                    fontWeight: isSelected ? '900' : '800',
                    color: isSelected ? AppColors.primary : AppColors.textMuted,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
