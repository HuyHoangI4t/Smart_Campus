import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  PanResponder,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useSegments, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';

const ORB_SIZE = 56;
const DOCKED_PEEK = 26; // Độ dày phần tab nhô ra khỏi mép màn hình khi ẩn

export function FloatingChatBot() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Xác định xem trang hiện tại có cần ẩn ChatBot không:
  // TRỪ: Trang Bản đồ (map), Trang Cài đặt (settings), và Trang Chatbot (chat)
  const isHiddenRoute = useMemo(() => {
    const path = (pathname || '').toLowerCase();
    const segs = (segments || []).map((s) => (typeof s === 'string' ? s.toLowerCase() : ''));

    // 1. Trang bản đồ
    if (path.includes('/map') || path === 'map' || segs.includes('map')) {
      return true;
    }
    // 2. Trang cài đặt
    if (path.includes('settings') || segs.includes('settings')) {
      return true;
    }
    // 3. Chính trang chat
    if (path.includes('/chat') || path === 'chat' || segs.includes('chat')) {
      return true;
    }
    return false;
  }, [pathname, segments]);

  // Hiệu ứng ẩn / hiện chuyển trang mượt mà (scale, opacity & slide) chứ không biến mất đột ngột
  const routeVisibilityAnim = useRef(new Animated.Value(isHiddenRoute ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(routeVisibilityAnim, {
      toValue: isHiddenRoute ? 0 : 1,
      friction: 8,
      tension: 55,
      useNativeDriver: true,
    }).start();
  }, [isHiddenRoute, routeVisibilityAnim]);

  // Trạng thái thu gọn vào mép màn hình
  const [isDocked, setIsDocked] = useState(false);
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right');
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hiệu ứng nhấp nháy đèn xanh online
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Giới hạn vùng di chuyển theo phương dọc (Y)
  const minY = insets.top + 50;
  const maxY = screenHeight - insets.bottom - 110;
  const initialY = Math.max(minY, Math.min(maxY, screenHeight - insets.bottom - 150));
  const initialX = screenWidth - ORB_SIZE - 16;

  // Tọa độ vị trí của quả bóng
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const currentPos = useRef({ x: initialX, y: initialY });
  const isDockedRef = useRef(false);
  const dockSideRef = useRef<'left' | 'right'>('right');

  useEffect(() => {
    isDockedRef.current = isDocked;
  }, [isDocked]);

  useEffect(() => {
    dockSideRef.current = dockSide;
  }, [dockSide]);

  // Lắng nghe thay đổi giá trị toạ độ
  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPos.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

  // Hàm chuyển đổi vị trí thu gọn / mở ra mượt mà với Animated.spring
  const animateToPosition = (targetX: number, targetY?: number, callback?: () => void) => {
    const safeY =
      targetY !== undefined
        ? Math.max(minY, Math.min(maxY, targetY))
        : Math.max(minY, Math.min(maxY, currentPos.current.y));

    Animated.spring(pan, {
      toValue: { x: targetX, y: safeY },
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start(() => {
      if (callback) callback();
    });
  };

  // 1. Chủ động ẩn vào mép màn hình
  const handleDockToEdge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const side = dockSideRef.current;
    const targetX = side === 'right' ? screenWidth - DOCKED_PEEK : -(ORB_SIZE - DOCKED_PEEK);
    setIsDocked(true);
    setShowTooltip(false);
    animateToPosition(targetX);
  };

  // 2. Chạm vào để mở ra khỏi mép màn hình
  const handleUndockFromEdge = (openChatDirectly = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const side = dockSideRef.current;
    const targetX = side === 'right' ? screenWidth - ORB_SIZE - 16 : 16;
    setIsDocked(false);
    animateToPosition(targetX, undefined, () => {
      if (openChatDirectly) {
        router.push('/(main)/chat' as any);
      } else {
        // Hiện bong bóng gợi ý trong 3 giây
        setShowTooltip(true);
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
          setShowTooltip(false);
        }, 3200);
      }
    });
  };

  // Mở màn hình Chatbot
  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowTooltip(false);
    router.push('/(main)/chat' as any);
  };

  // Xử lý kéo thả (PanGesture / PanResponder)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const totalMoveX = Math.abs(gesture.dx);
        const totalMoveY = Math.abs(gesture.dy);

        // NẾU LÀ CÚ CHẠM (TAP - di chuyển rất ít < 6px)
        if (totalMoveX < 6 && totalMoveY < 6) {
          if (isDockedRef.current) {
            // Khi đang ẩn ở cạnh: Chạm vào sẽ bung mở ra ("có thể mở khi chạm vào")!
            handleUndockFromEdge();
          } else {
            // Khi đang mở bình thường: Chạm vào sẽ mở ngay Chatbot!
            handleOpenChat();
          }
          return;
        }

        // NẾU LÀ KÉO THẢ (DRAG)
        const finalX = currentPos.current.x;
        const finalY = currentPos.current.y;
        const isRightSide = finalX + ORB_SIZE / 2 > screenWidth / 2;
        const newSide = isRightSide ? 'right' : 'left';
        setDockSide(newSide);

        // Nếu vuốt mạnh hoặc kéo sát cạnh màn hình (< 24px) -> Tự động thu gọn vào mép
        const closeToEdge =
          (isRightSide && finalX > screenWidth - ORB_SIZE - 20) ||
          (!isRightSide && finalX < 20) ||
          (isRightSide && gesture.vx > 0.4) ||
          (!isRightSide && gesture.vx < -0.4);

        if (closeToEdge) {
          setIsDocked(true);
          const dockX = isRightSide ? screenWidth - DOCKED_PEEK : -(ORB_SIZE - DOCKED_PEEK);
          animateToPosition(dockX, finalY);
        } else {
          setIsDocked(false);
          const snapX = isRightSide ? screenWidth - ORB_SIZE - 16 : 16;
          animateToPosition(snapX, finalY);
        }
      },
    })
  ).current;

  const isRight = dockSide === 'right';

  const routeScale = routeVisibilityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 1],
  });

  const routeOpacity = routeVisibilityAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.2, 1],
  });

  const routeSlideX = routeVisibilityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isRight ? 65 : -65, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: routeOpacity,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { translateX: routeSlideX },
            { scale: routeScale },
          ],
        },
      ]}
      pointerEvents={isHiddenRoute ? 'none' : 'box-none'}
    >
      {/* ─── BONG BÓNG GỢI Ý KHI VỪA MỞ RA KHỎI MÉP ─── */}
      {showTooltip && !isDocked && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleOpenChat}
          style={[
            styles.tooltipBubble,
            isRight ? styles.tooltipBubbleRight : styles.tooltipBubbleLeft,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
          ]}
        >
          <Feather name="message-square" size={13} color="#2563EB" style={{ marginRight: 5 }} />
          <Text style={[styles.tooltipText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            Nhấn để chat với TTN AI
          </Text>
          <Feather name="arrow-right" size={12} color="#2563EB" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}

      {/* ─── PHẦN THÂN BÓNG CHAT VÀ NÚT ẨN VÀO CẠNH ─── */}
      <View
        {...panResponder.panHandlers}
        style={[styles.orbContainer, isDocked && (isRight ? styles.dockedRight : styles.dockedLeft)]}
      >
        {/* NÚT CHỦ ĐỘNG ẨN VÀO CẠNH (Chỉ hiển thị khi đang mở bình thường) */}
        {!isDocked && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleDockToEdge}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.dockButton,
              isRight ? styles.dockButtonRight : styles.dockButtonLeft,
              { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.95)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Ẩn chat bot vào cạnh màn hình"
          >
            <Feather
              name={isRight ? 'chevron-right' : 'chevron-left'}
              size={13}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </TouchableOpacity>
        )}

        {/* BÓNG TRÒN CHÍNH MANG LOGO TTN AI */}
        <Pressable
          onPress={() => {
            if (isDocked) {
              handleUndockFromEdge();
            } else {
              handleOpenChat();
            }
          }}
          style={({ pressed }) => [styles.orb, pressed && styles.orbPressed]}
          accessibilityRole="button"
          accessibilityLabel={isDocked ? 'Chạm để mở chat bot' : 'Mở trợ lý ảo thông minh TTN AI'}
        >
          {/* Logo chính thức Đại học Tây Nguyên */}
          <Image
            source={require('../../../../assets/images/favicon.png')}
            style={styles.logo}
            resizeMode="cover"
          />

          {/* Viền kính mờ tinh tế */}
          <View style={styles.glassRim} />

          {/* Chấm tròn báo AI Online */}
          <Animated.View
            style={[
              styles.pulseDot,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Mũi tên gợi ý chạm để mở khi đang ẩn ở mép */}
          {isDocked && (
            <View style={[styles.dockedIndicator, isRight ? { left: 4 } : { right: 4 }]}>
              <Feather
                name={isRight ? 'chevron-left' : 'chevron-right'}
                size={14}
                color="#FFFFFF"
              />
            </View>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  orbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  orbPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }],
  },
  logo: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  glassRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  pulseDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  // Nút chủ động ẩn vào cạnh
  dockButton: {
    position: 'absolute',
    width: 20,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  dockButtonRight: {
    right: -7,
  },
  dockButtonLeft: {
    left: -7,
  },
  // Khi ẩn vào cạnh
  dockedRight: {
    opacity: 0.92,
  },
  dockedLeft: {
    opacity: 0.92,
  },
  dockedIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 8,
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bong bóng gợi ý
  tooltipBubble: {
    position: 'absolute',
    top: -38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  tooltipBubbleRight: {
    right: 0,
  },
  tooltipBubbleLeft: {
    left: 0,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
