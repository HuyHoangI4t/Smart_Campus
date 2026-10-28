import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { AppColors } from '../constants/appColors';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'navy' | 'emerald' | 'indigo' | 'crimson';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  background: string;
  cardBg: string;
  muted: string;
  border: string;
  cardBorder: string;
  textForeground: string;
  text: string;
  textSecondary: string;
  subtext: string;
  textMuted: string;
  textSubtle: string;
  textLight: string;
  success: string;
  warning: string;
  danger: string;
  error: string;
  info: string;
  purple: string;
}

export const ACCENT_PRESETS: Record<AccentColor, {
  name: string;
  label: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
}> = {
  navy: {
    name: 'navy',
    label: 'Xanh Navy (Tây Nguyên)',
    primary: '#0F2964',
    primaryLight: '#1E3E8F',
    accent: '#2563EB',
    accentLight: '#60A5FA',
  },
  emerald: {
    name: 'emerald',
    label: 'Xanh Rừng (Đại Ngàn)',
    primary: '#065F46',
    primaryLight: '#047857',
    accent: '#059669',
    accentLight: '#34D399',
  },
  indigo: {
    name: 'indigo',
    label: 'Tím Hiện Đại (Công Nghệ)',
    primary: '#3730A3',
    primaryLight: '#4338CA',
    accent: '#6366F1',
    accentLight: '#A78BFA',
  },
  crimson: {
    name: 'crimson',
    label: 'Đất Đỏ Bazan (Tây Nguyên)',
    primary: '#78350F',
    primaryLight: '#92400E',
    accent: '#D97706',
    accentLight: '#FBBF24',
  },
};

export function getLightPalette(accent: AccentColor = 'navy'): ThemeColors {
  const brand = ACCENT_PRESETS[accent] || ACCENT_PRESETS.navy;
  return {
    primary: brand.primary,
    primaryLight: brand.primaryLight,
    accent: brand.accent,
    accentLight: brand.accentLight,
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    muted: '#F1F5F9',
    border: '#E2E8F0',
    cardBorder: '#EEF2F6',
    textForeground: '#0F172A',
    text: '#0F172A',
    textSecondary: '#64748B',
    subtext: '#64748B',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    textLight: '#93C5FD',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    error: '#EF4444',
    info: '#2563EB',
    purple: '#8B5CF6',
  };
}

export function getDarkPalette(accent: AccentColor = 'navy'): ThemeColors {
  const brand = ACCENT_PRESETS[accent] || ACCENT_PRESETS.navy;
  return {
    primary: brand.primaryLight,
    primaryLight: brand.primary,
    accent: brand.accentLight,
    accentLight: brand.accent,
    background: '#0B1120',      // Nền tối chuẩn OLED / Slate 950
    cardBg: '#1E293B',          // Nền thẻ Slate 800
    muted: '#0F172A',           // Nền inset lồng trong thẻ (Slate 900)
    border: '#334155',          // Viền Slate 700
    cardBorder: '#334155',
    textForeground: '#F8FAFC',  // Chữ trắng sáng Slate 50 (17.8:1)
    text: '#F8FAFC',            // Chữ chính
    textSecondary: '#94A3B8',   // Chữ phụ Slate 400 (7.4:1)
    subtext: '#94A3B8',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',      // Chữ mờ Slate 500
    textLight: '#93C5FD',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    error: '#EF4444',
    info: '#38BDF8',
    purple: '#A78BFA',
  };
}

// Đồng bộ đối tượng tĩnh AppColors để các module đọc trực tiếp luôn có màu mới nhất
export function syncGlobalAppColors(theme: 'light' | 'dark', accent: AccentColor = 'navy') {
  const target = theme === 'dark' ? getDarkPalette(accent) : getLightPalette(accent);
  Object.assign(AppColors, target);
}

export interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  effectiveTheme: 'light' | 'dark';
  isDark: boolean;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => Promise<void>;
  colors: ThemeColors;
  // Cài đặt ứng dụng bổ sung
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  defaultSatelliteMap: boolean;
  setDefaultSatelliteMap: (enabled: boolean) => Promise<void>;
  compassEnabled: boolean;
  setCompassEnabled: (enabled: boolean) => Promise<void>;
  clearAppCache: () => Promise<number>;
  triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME_MODE: '@app_theme_mode',
  ACCENT_COLOR: '@app_accent_color',
  HAPTICS: '@app_setting_haptics',
  NOTIFICATIONS: '@app_setting_notifications',
  MAP_SATELLITE: '@app_setting_map_satellite',
  COMPASS: '@app_setting_compass',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [accentColor, setAccentColorState] = useState<AccentColor>('navy');
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [defaultSatelliteMap, setDefaultSatelliteMapState] = useState<boolean>(false);
  const [compassEnabled, setCompassEnabledState] = useState<boolean>(true);

  // Nạp cấu hình từ AsyncStorage khi khởi động app
  useEffect(() => {
    async function loadSettings() {
      try {
        const [
          savedTheme,
          savedAccent,
          savedHaptics,
          savedNotifications,
          savedSatellite,
          savedCompass,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.ACCENT_COLOR),
          AsyncStorage.getItem(STORAGE_KEYS.HAPTICS),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
          AsyncStorage.getItem(STORAGE_KEYS.MAP_SATELLITE),
          AsyncStorage.getItem(STORAGE_KEYS.COMPASS),
        ]);

        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeModeState(savedTheme as ThemeMode);
        }
        if (savedAccent && savedAccent in ACCENT_PRESETS) {
          setAccentColorState(savedAccent as AccentColor);
        }
        if (savedHaptics !== null) {
          setHapticsEnabledState(savedHaptics === 'true');
        }
        if (savedNotifications !== null) {
          setNotificationsEnabledState(savedNotifications === 'true');
        }
        if (savedSatellite !== null) {
          setDefaultSatelliteMapState(savedSatellite === 'true');
        }
        if (savedCompass !== null) {
          setCompassEnabledState(savedCompass === 'true');
        }
      } catch (err) {
        console.warn('[ThemeContext] Lỗi đọc cấu hình từ storage:', err);
      }
    }
    loadSettings();
  }, []);

  // Tính toán theme thực tế (nếu là 'system' thì theo thiết bị)
  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const isDark = effectiveTheme === 'dark';

  // Lấy bộ màu tương ứng
  const colors: ThemeColors = useMemo(() => {
    return isDark ? getDarkPalette(accentColor) : getLightPalette(accentColor);
  }, [isDark, accentColor]);

  // Cập nhật AppColors toàn cục
  useEffect(() => {
    syncGlobalAppColors(effectiveTheme, accentColor);
  }, [effectiveTheme, accentColor]);

  // Bộ kích hoạt rung có kiểm tra cấu hình bật/tắt
  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!hapticsEnabled) return;
    try {
      switch (style) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          break;
      }
    } catch {}
  }, [hapticsEnabled]);

  // Hàm đổi Theme Mode
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    triggerHaptic('light');
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (err) {
      console.warn('[ThemeContext] Lỗi lưu themeMode:', err);
    }
  }, [triggerHaptic]);

  // Hàm đổi Accent Color
  const setAccentColor = useCallback(async (accent: AccentColor) => {
    setAccentColorState(accent);
    triggerHaptic('medium');
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, accent);
    } catch (err) {
      console.warn('[ThemeContext] Lỗi lưu accentColor:', err);
    }
  }, [triggerHaptic]);

  // Hàm bật/tắt Haptics
  const setHapticsEnabled = useCallback(async (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    if (enabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAPTICS, String(enabled));
    } catch (err) {
      console.warn('[ThemeContext] Lỗi lưu hapticsEnabled:', err);
    }
  }, []);

  // Hàm bật/tắt Notifications
  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    triggerHaptic('light');
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, String(enabled));
    } catch (err) {
      console.warn('[ThemeContext] Lỗi lưu notificationsEnabled:', err);
    }
  }, [triggerHaptic]);

  // Hàm bật/tắt Bản đồ vệ tinh mặc định
  const setDefaultSatelliteMap = useCallback(async (enabled: boolean) => {
    setDefaultSatelliteMapState(enabled);
    triggerHaptic('light');
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAP_SATELLITE, String(enabled));
    } catch (err) {
      console.warn('[ThemeContext] Lỗi lưu defaultSatelliteMap:', err);
    }
  }, [triggerHaptic]);

  // Hàm bật/tắt Xoay la bàn tự động
  const setCompassEnabled = useCallback(async (enabled: boolean) => {
    setCompassEnabledState(enabled);
    triggerHaptic('light');
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPASS, String(enabled));
    } catch (err) {
      console.warn('[ThemeContext] Lỗi lưu compassEnabled:', err);
    }
  }, [triggerHaptic]);

  // Xóa bộ nhớ đệm (Clear App Cache) an toàn
  const clearAppCache = useCallback(async (): Promise<number> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      // Loại trừ các khóa bảo vệ tài khoản và thiết lập người dùng
      const protectedKeys = new Set([
        '@auth_user',
        '@auth_token',
        STORAGE_KEYS.THEME_MODE,
        STORAGE_KEYS.ACCENT_COLOR,
        STORAGE_KEYS.HAPTICS,
        STORAGE_KEYS.NOTIFICATIONS,
        STORAGE_KEYS.MAP_SATELLITE,
        STORAGE_KEYS.COMPASS,
      ]);

      const keysToRemove = allKeys.filter((k) => !protectedKeys.has(k) && (
        k.startsWith('@cache_') ||
        k.startsWith('@tnu_') ||
        k.startsWith('@temp_') ||
        k.startsWith('@offline_')
      ));

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      triggerHaptic('success');
      return keysToRemove.length;
    } catch (err) {
      console.warn('[ThemeContext] Lỗi xóa cache:', err);
      return 0;
    }
  }, [triggerHaptic]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      effectiveTheme,
      isDark,
      accentColor,
      setAccentColor,
      colors,
      hapticsEnabled,
      setHapticsEnabled,
      notificationsEnabled,
      setNotificationsEnabled,
      defaultSatelliteMap,
      setDefaultSatelliteMap,
      compassEnabled,
      setCompassEnabled,
      clearAppCache,
      triggerHaptic,
    }),
    [
      themeMode,
      setThemeMode,
      effectiveTheme,
      isDark,
      accentColor,
      setAccentColor,
      colors,
      hapticsEnabled,
      setHapticsEnabled,
      notificationsEnabled,
      setNotificationsEnabled,
      defaultSatelliteMap,
      setDefaultSatelliteMap,
      compassEnabled,
      setCompassEnabled,
      clearAppCache,
      triggerHaptic,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Giá trị dự phòng nếu gọi ngoài Provider
    return {
      themeMode: 'light',
      setThemeMode: async () => {},
      effectiveTheme: 'light',
      isDark: false,
      accentColor: 'navy',
      setAccentColor: async () => {},
      colors: getLightPalette('navy'),
      hapticsEnabled: true,
      setHapticsEnabled: async () => {},
      notificationsEnabled: true,
      setNotificationsEnabled: async () => {},
      defaultSatelliteMap: false,
      setDefaultSatelliteMap: async () => {},
      compassEnabled: true,
      setCompassEnabled: async () => {},
      clearAppCache: async () => 0,
      triggerHaptic: () => {},
    };
  }
  return context;
}

