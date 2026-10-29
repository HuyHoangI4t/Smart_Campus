import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';


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

// Danh sách Tab dành riêng cho chế độ Khách (Chỉ có 3 tab: Trang chủ, Bản đồ, Hồ sơ)
export const GUEST_TAB_ITEMS: TabItemConfig[] = [
  { route: 'home/index', label: 'Trang chủ', icon: 'grid' },
  { route: 'map/index', label: 'Bản đồ', icon: 'navigation' },
  { route: 'profile/index', label: 'Hồ sơ', icon: 'user' },
];

// Danh sách Tab đầy đủ 5 mục dành cho Sinh viên đã đăng nhập
export const STUDENT_TAB_ITEMS: TabItemConfig[] = [
  { route: 'home/index', label: 'Trang chủ', icon: 'grid' },
  { route: 'schedule/index', label: 'Lịch học', icon: 'calendar' },
  { route: 'map/index', label: 'Bản đồ', icon: 'navigation' },
  { route: 'grades/index', label: 'Điểm', icon: 'award' },
  { route: 'profile/index', label: 'Hồ sơ', icon: 'user' },
];

export const TAB_ITEMS = STUDENT_TAB_ITEMS;

type TabBarVisibilityListener = (visible: boolean) => void;
const visibilityListeners: Set<TabBarVisibilityListener> = new Set();
let currentTabBarVisible = true;

export function setTabBarVisible(visible: boolean) {
  currentTabBarVisible = visible;
  visibilityListeners.forEach((listener) => listener(visible));
}

// Bộ lắng nghe sự kiện đăng nhập / đăng xuất để cập nhật ngay thanh Bottom Nav
type AuthChangeListener = (guest: boolean) => void;
const authChangeListeners: Set<AuthChangeListener> = new Set();

export function notifyAuthChanged() {
  AsyncStorage.getItem('@auth_user').then((userStr) => {
    let guest = true;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const mssv = u.mssv || u.masv || '';
        if (mssv && mssv !== 'guest') guest = false;
      } catch {}
    }
    authChangeListeners.forEach((listener) => listener(guest));
  }).catch(() => {});
}

export function useTabBarScrollHandler() {
  const insets = useSafeAreaInsets();
  const visiblePad = Math.max(insets.bottom, 16) + 74;
  const hiddenPad = Math.max(insets.bottom, 16) + 16;

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastOffsetY = useRef(0);
  const isTabBarVisibleRef = useRef(true);

  const onScroll = useCallback((event: any) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const maxOffsetY = Math.max(0, contentHeight - layoutHeight);

    // 1. Chặn bounce âm ở đỉnh
    if (currentOffsetY <= 0) {
      lastOffsetY.current = currentOffsetY;
      if (!isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = true;
        setIsNavVisible(true);
        setTabBarVisible(true);
      }
      return;
    }

    // 2. Không ẩn thanh nav nếu nội dung trang quá ngắn (không cuộn được)
    if (contentHeight <= layoutHeight + 40) {
      lastOffsetY.current = currentOffsetY;
      return;
    }

    // 3. Chặn hiện lại thanh nav do bounce ở đáy trang
    if (maxOffsetY > 0 && currentOffsetY >= maxOffsetY - 12) {
      lastOffsetY.current = currentOffsetY;
      return;
    }

    const diff = currentOffsetY - lastOffsetY.current;

    // 4. Khi cuộn xuống: ẩn nav chạy xuống dưới
    if (diff > 4 && currentOffsetY > 25) {
      if (isTabBarVisibleRef.current) {
        isTabBarVisibleRef.current = false;
        setIsNavVisible(false);
        setTabBarVisible(false);
      }
    }
    // 5. Khi chủ động cuộn ngược lên: hiện nav chạy lên vị trí cũ
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
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);
  const hideDistance = 160 + insets.bottom;

  const translateY = useRef(new Animated.Value(currentTabBarVisible ? 0 : hideDistance)).current;
  const opacity = useRef(new Animated.Value(currentTabBarVisible ? 1 : 0)).current;
  const [isVisible, setIsVisible] = useState(currentTabBarVisible);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [dockWidth, setDockWidth] = useState(0);

  // Tự động kiểm tra quyền khách / sinh viên để ẩn hoặc hiện tab Lịch học & Điểm số
  useEffect(() => {
    let isMounted = true;
    const checkUserRole = async () => {
      try {
        const userStr = await AsyncStorage.getItem('@auth_user');
        if (!isMounted) return;
        if (userStr) {
          const u = JSON.parse(userStr);
          const mssv = u.mssv || u.masv || '';
          setIsGuest(!mssv || mssv === 'guest');
        } else {
          setIsGuest(true);
        }
      } catch {
        if (isMounted) setIsGuest(true);
      }
    };

    checkUserRole();

    const listener = (guest: boolean) => {
      if (isMounted) setIsGuest(guest);
    };
    authChangeListeners.add(listener);

    return () => {
      isMounted = false;
      authChangeListeners.delete(listener);
    };
  }, [props]);

  useEffect(() => {
    const listener = (visible: boolean) => {
      setIsVisible(visible);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: visible ? 0 : hideDistance,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: visible ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };
    visibilityListeners.add(listener);
    return () => {
      visibilityListeners.delete(listener);
    };
  }, [hideDistance, translateY, opacity]);

  const isTabBarProps = 'state' in props;
  const currentTabs = isGuest ? GUEST_TAB_ITEMS : STUDENT_TAB_ITEMS;

  let activeIndex = 0;
  let isSubScreenHidden = false;

  if (isTabBarProps) {
    const currentRoute = props.state.routes[props.state.index];
    const descriptor = (props as BottomTabBarProps).descriptors?.[currentRoute?.key];
    const tabBarStyle: any = descriptor?.options?.tabBarStyle;
    if (tabBarStyle?.display === 'none') {
      isSubScreenHidden = true;
    }

    const matchIndex = currentTabs.findIndex((t) => t.route === currentRoute?.name);
    if (matchIndex === -1) {
      isSubScreenHidden = true;
    } else {
      activeIndex = matchIndex;
    }
  } else {
    activeIndex = props.selectedIndex;
  }

  // Hiệu ứng lướt chuyển tab mượt mà với Animated.spring
  const indicatorAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicatorAnim]);

  // Khi chuyển tab, chỉ trượt thanh nav lên nếu không bị lệnh ẩn ép buộc
  useEffect(() => {
    if (currentTabBarVisible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeIndex, translateY, opacity]);

  if (isSubScreenHidden) {
    return null;
  }

  const handleSelect = (index: number) => {
    if (isTabBarProps) {
      const targetItem = currentTabs[index];
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

  const innerWidth = Math.max(0, dockWidth - 12);
  const tabWidth = currentTabs.length > 0 ? innerWidth / currentTabs.length : 0;

  const indicatorTranslateX =
    tabWidth > 0 && currentTabs.length >= 2
      ? indicatorAnim.interpolate({
          inputRange: currentTabs.map((_, i) => i),
          outputRange: currentTabs.map((_, i) => i * tabWidth),
          extrapolate: 'clamp',
        })
      : 0;

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        styles.navContainer,
        {
          paddingBottom: Math.max(bottomPadding - 74, insets.bottom + 12),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        onLayout={(e) => setDockWidth(e.nativeEvent.layout.width)}
        style={[
          styles.pillDock,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.45)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.82)',
            shadowColor: isDark ? '#000000' : '#0F172A',
            shadowOpacity: isDark ? 0.5 : 0.12,
          },
        ]}
      >
        {/* Lớp hiệu ứng Blur Kính Mờ Frosted Glass */}
        <View style={[StyleSheet.absoluteFill, { borderRadius: 44, overflow: 'hidden' }]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 95}
            tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(15, 23, 42, 0.68)'
                  : 'rgba(255, 255, 255, 0.70)',
              },
            ]}
          />
        </View>

        {/* Chỉ báo lướt chuyển tab mượt mà (Sliding pill active indicator) */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingIndicator,
              {
                width: tabWidth,
                transform: [{ translateX: indicatorTranslateX }],
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          />
        )}

        {currentTabs.map((item, index) => {
          const isSelected = index === activeIndex;

          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleSelect(index)}
              activeOpacity={0.7}
              style={styles.tabPill}
            >
              <Feather
                name={item.icon}
                size={22}
                color={
                  isSelected
                    ? (isDark ? '#FFFFFF' : '#0F172A')
                    : (isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B')
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected
                      ? (isDark ? '#FFFFFF' : '#0F172A')
                      : (isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B'),
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
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

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    zIndex: 100,
  },
  pillDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 44,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
    elevation: 8,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    left: 6,
    top: 8,
    bottom: 8,
    borderRadius: 26,
    borderWidth: 1,
    zIndex: 1,
  },
  tabPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 26,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
