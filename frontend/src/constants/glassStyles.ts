import { StyleSheet, ViewStyle } from 'react-native';

/**
 * Hệ thống định kiểu Kính Mờ (Glassmorphism Design System)
 * Cung cấp các token chuẩn về độ trong suốt, viền phản xạ ánh sáng (specular highlight rim),
 * đổ bóng môi trường (ambient shadow) và bo góc cho toàn bộ ứng dụng.
 */

export const GlassTokens = {
  // Màu nền mờ bán trong suốt (Translucent Backgrounds)
  light: {
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceElevated: 'rgba(255, 255, 255, 0.85)',
    surfaceSubtle: 'rgba(241, 245, 249, 0.65)',
    border: 'rgba(255, 255, 255, 0.82)',
    borderSubtle: 'rgba(226, 232, 240, 0.70)',
    shadow: 'rgba(15, 23, 42, 0.08)',
    highlight: 'rgba(255, 255, 255, 0.95)',
  },
  dark: {
    surface: 'rgba(30, 41, 59, 0.65)',
    surfaceElevated: 'rgba(30, 41, 59, 0.80)',
    surfaceSubtle: 'rgba(15, 23, 42, 0.55)',
    border: 'rgba(255, 255, 255, 0.14)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.40)',
    highlight: 'rgba(255, 255, 255, 0.20)',
  },
  radii: {
    card: 22,
    cardSm: 16,
    cardLg: 28,
    pill: 99,
    icon: 14,
  },
};

export const glassStyles = StyleSheet.create({
  // 1. Thẻ kính tiêu chuẩn (Base Glass Card)
  card: {
    borderRadius: GlassTokens.radii.card,
    borderWidth: 1.2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    overflow: 'hidden',
  },

  // 2. Thẻ kính nổi bật (Elevated Glass Card)
  cardElevated: {
    borderRadius: GlassTokens.radii.card,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5,
    overflow: 'hidden',
  },

  // 3. Thẻ kính lồng phụ (Subtle Inset Glass Card)
  cardSubtle: {
    borderRadius: GlassTokens.radii.cardSm,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },

  // 4. Viên thuốc / Chip kính mờ (Glass Pill & Badge)
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: GlassTokens.radii.pill,
    borderWidth: 1,
  },

  // 5. Ô nhập liệu kính mờ (Glass Input Box)
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: GlassTokens.radii.cardSm,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // 6. Hộp Icon kính mờ (Glass Icon Squircle)
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: GlassTokens.radii.icon,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 7. Nút bấm kính mờ (Glass Button)
  button: {
    height: 48,
    borderRadius: GlassTokens.radii.cardSm,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
});

/**
 * Trình tạo style kính mờ linh hoạt theo trạng thái giao diện Dark/Light Mode
 */
export function getGlassPalette(isDark: boolean) {
  const tokens = isDark ? GlassTokens.dark : GlassTokens.light;
  return {
    card: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      shadowColor: '#000',
    } as ViewStyle,
    cardElevated: {
      backgroundColor: tokens.surfaceElevated,
      borderColor: tokens.border,
      shadowColor: '#000',
    } as ViewStyle,
    cardSubtle: {
      backgroundColor: tokens.surfaceSubtle,
      borderColor: tokens.borderSubtle,
    } as ViewStyle,
    pill: {
      backgroundColor: tokens.surfaceSubtle,
      borderColor: tokens.borderSubtle,
    } as ViewStyle,
    input: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
    } as ViewStyle,
    iconBox: {
      backgroundColor: tokens.surfaceSubtle,
      borderColor: tokens.borderSubtle,
    } as ViewStyle,
    button: {
      backgroundColor: tokens.surfaceElevated,
      borderColor: tokens.border,
    } as ViewStyle,
  };
}

