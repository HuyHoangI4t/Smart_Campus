import { Platform, StatusBar, Dimensions } from 'react-native';

/**
 * Kiểm tra xem thiết bị có phải là iPhone có Dynamic Island (iPhone 14 Pro, 15, 16 series) hay không.
 */
export function hasDynamicIsland(insetsTop: number = 0): boolean {
  if (insetsTop >= 54) return true;

  const { width, height } = Dimensions.get('window');
  const screenHeight = Math.max(width, height);
  const screenWidth = Math.min(width, height);

  // Kích thước chuẩn các dòng iPhone có Dynamic Island (points):
  // iPhone 14 Pro, 15, 15 Pro, 16: 393 x 852
  // iPhone 16 Pro: 402 x 874
  // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus: 430 x 932
  // iPhone 16 Pro Max: 440 x 956
  const isIslandDimension =
    (screenHeight === 852 && screenWidth === 393) ||
    (screenHeight === 874 && screenWidth === 402) ||
    (screenHeight === 932 && screenWidth === 430) ||
    (screenHeight === 956 && screenWidth === 440) ||
    (screenHeight >= 850 && screenHeight <= 960 && screenWidth >= 385 && screenWidth <= 445);

  return isIslandDimension;
}

/**
 * Kiểm tra xem thiết bị có tai thỏ (Notch) từ iPhone X đến iPhone 14 hay không.
 */
export function hasNotch(insetsTop: number = 0): boolean {
  if (hasDynamicIsland(insetsTop)) return true;
  if (insetsTop >= 44) return true;

  const { width, height } = Dimensions.get('window');
  const screenHeight = Math.max(width, height);
  const screenWidth = Math.min(width, height);

  return screenHeight >= 780 && screenWidth >= 360;
}

/**
 * Tính toán paddingTop tối ưu và an toàn nhất cho Header
 * Tránh hoàn toàn việc bị che khuất bởi Dynamic Island (Đảo động), Tai thỏ (Notch) hoặc StatusBar Android.
 *
 * @param insetsTop Chiều cao an toàn từ hook `useSafeAreaInsets().top`
 * @param extraPadding Khoảng cách đệm thêm từ chân đảo động / status bar xuống nội dung header (mặc định 14)
 */
export function getHeaderTopPadding(insetsTop: number = 0, extraPadding: number = 14): number {
  if (Platform.OS === 'android') {
    const androidStatus = StatusBar.currentHeight || 24;
    return Math.max(androidStatus, insetsTop) + extraPadding;
  }

  const isIsland = hasDynamicIsland(insetsTop);
  const isNotchDevice = hasNotch(insetsTop);

  let safeTop = insetsTop;
  if (isIsland) {
    // Dynamic Island chiếm từ đỉnh xuống khoảng 48-54pt. Safe inset chuẩn của Apple là 59pt.
    safeTop = Math.max(insetsTop, 59);
  } else if (isNotchDevice) {
    // Tai thỏ iPhone X -> 14 chiếm 44 - 47pt.
    safeTop = Math.max(insetsTop, 47);
  } else if (Platform.OS === 'ios') {
    // iPhone thế hệ có Home button hoặc fallback iOS: tối thiểu 44pt để header thoáng
    safeTop = Math.max(insetsTop, 44);
  } else {
    // Web / Giả lập trình duyệt
    const { width, height } = Dimensions.get('window');
    const screenHeight = Math.max(width, height);
    const screenWidth = Math.min(width, height);
    if (screenHeight >= 800 && screenWidth <= 450) {
      safeTop = Math.max(insetsTop, 59);
    } else {
      safeTop = Math.max(insetsTop, 24);
    }
  }

  return safeTop + extraPadding;
}

