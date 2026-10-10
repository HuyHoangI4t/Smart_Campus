import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
  icon: keyof typeof Feather.glyphMap;
  isCenter?: boolean;
}

const TAB_ITEMS: TabItemConfig[] = [
  { route: 'home/index', label: 'Trang chủ', icon: 'home' },
  { route: 'schedule/index', label: 'Lịch học', icon: 'calendar' },
  { route: 'map/index', label: 'Bản đồ', icon: 'navigation', isCenter: true },
  { route: 'grades/index', label: 'Điểm', icon: 'bar-chart-2' },
  { route: 'profile/index', label: 'Hồ sơ', icon: 'user' },
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
  const visiblePad = options?.visiblePadding ?? 115;
  const hiddenPad = options?.hiddenPadding ?? 115;

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastOffsetY = useRef(0);
  const isTabBarVisibleRef = useRef(true);

  const onScroll = useCallback((event: any) => {
    const nativeEvent = event?.nativeEvent;
    if (!nativeEvent) return;

    const currentOffsetY = nativeEvent.contentOffset?.y ?? 0;
    const contentHeight = nativeEvent.contentSize?.height ?? 0;
    const layoutHeight = nativeEvent.layoutMeasurement?.height ?? 0;

    // Chiều cao cuộn tối đa thực tế của nội dung
    const maxOffsetY = Math.max(0, contentHeight - layoutHeight);

    // 1. Khi đang ở gần đỉnh trang (<= 20px), luôn luôn giữ/hiện thanh nav
    if (currentOffsetY <= 20) {
      if (!isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = true;
        setIsNavVisible(true);
        setTabBarVisible(true);
      }
      lastOffsetY.current = Math.max(0, currentOffsetY);
      return;
    }

    // 2. Chặn overscroll ở đỉnh (kéo quá đỉnh trang)
    if (currentOffsetY < 0) {
      lastOffsetY.current = 0;
      return;
    }

    // 3. Chặn overscroll ở đáy: Khi người dùng kéo kịch trang (hoặc kéo quá đáy rồi thả tay nảy ngược lại)
    // Cú nảy overscroll rubber-band tạo diff < 0 giả. Ta CHẶN không cho hiện lại nav khi đang ở sát đáy!
    if (maxOffsetY > 0 && currentOffsetY >= maxOffsetY - 12) {
      lastOffsetY.current = currentOffsetY;
      return;
    }

    const diff = currentOffsetY - lastOffsetY.current;

    // 4. Khi cuộn xuống (diff > 4 và đã cuộn qua đỉnh > 25px): ẩn nav chạy xuống dưới
    if (diff > 4 && currentOffsetY > 25) {
      if (isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = false;
        setIsNavVisible(false);
        setTabBarVisible(false);
      }
    }
    // 5. Khi chủ động cuộn ngược lên (diff < -6 và không ở vùng sát đáy): hiện nav chạy lên vị trí cũ
    else if (diff < -6 && (maxOffsetY === 0 || currentOffsetY < maxOffsetY - 28)) {
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

          if (item.isCenter) {
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => handleSelect(index)}
                activeOpacity={0.85}
                style={tabBarStyles.centerTabItem}
              >
                <View
                  style={[
                    tabBarStyles.centerIconContainer,
                    isSelected && tabBarStyles.centerIconSelected,
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={22}
                    color="#FFFFFF"
                  />
                </View>
                <Text
                  style={[
                    tabBarStyles.centerLabel,
                    {
                      color: isSelected ? AppColors.primary : AppColors.textMuted,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }

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
                <Feather
                  name={item.icon}
                  size={20}
                  color={isSelected ? AppColors.primary : AppColors.textMuted}
                />
              </View>
              <Text
                style={[
                  tabBarStyles.label,
                  {
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? AppColors.primary : AppColors.textMuted,
                  },
                ]}
              >
                {item.label}
              </Text>
              {isSelected && <View style={tabBarStyles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
