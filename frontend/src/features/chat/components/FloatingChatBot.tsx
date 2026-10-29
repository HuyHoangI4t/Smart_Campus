import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  PanResponder,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useSegments, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';

const ORB_SIZE = 64;
const DOCKED_PEEK = 36; // Độ dày phần tab nhô ra khỏi mép màn hình khi ẩn

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
      useNativeDriver: false,
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
      friction: 7,
      tension: 62,
      useNativeDriver: false,
    }).start(() => {
      if (callback) callback();
    });
  };

  // 1. Chủ động ẩn vào mép màn hình: trượt sang ngang rìa màn hình gần nhất
  const handleDockToEdge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Luôn xác định rìa màn hình gần nhất dựa theo tọa độ X hiện tại
    const isRightSide = currentPos.current.x + ORB_SIZE / 2 >= screenWidth / 2;
    const side = isRightSide ? 'right' : 'left';
    setDockSide(side);
    dockSideRef.current = side;

    const targetX = side === 'right' ? screenWidth - DOCKED_PEEK : -(ORB_SIZE - DOCKED_PEEK);
    isDockedRef.current = true;
    setIsDocked(true);
    setShowTooltip(false);
    // Trượt dứt khoát theo phương ngang thẳng vào mép màn hình gần nhất
    animateToPosition(targetX, currentPos.current.y);
  };

  // 2. Chạm vào để mở ra khỏi mép màn hình
  const handleUndockFromEdge = (openChatDirectly = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const side = dockSideRef.current;
    const targetX = side === 'right' ? screenWidth - ORB_SIZE - 16 : 16;
    isDockedRef.current = false;
    setIsDocked(false);
    // Trượt sang ngang bung ra khỏi mép màn hình về vị trí nổi tự do
    animateToPosition(targetX, currentPos.current.y, () => {
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

        // 1. NẾU ĐANG ẨN Ở CẠNH (DOCKED): Bất kỳ cú chạm hoặc vuốt nào vào tab nhô ra cũng BUNG MỞ RA NGAY!
        if (isDockedRef.current) {
          handleUndockFromEdge();
          return;
        }

        // 2. NẾU ĐANG MỞ VÀ LÀ CÚ CHẠM (TAP < 14px): Mở màn hình chat ngay!
        if (totalMoveX < 14 && totalMoveY < 14) {
          handleOpenChat();
          return;
        }

        // 3. NẾU LÀ KÉO THẢ (DRAG): Tính toán vị trí thả của quả bóng
        const finalX = currentPos.current.x;
        const finalY = currentPos.current.y;
        const isRightSide = finalX + ORB_SIZE / 2 > screenWidth / 2;
        const newSide = isRightSide ? 'right' : 'left';
        setDockSide(newSide);
        dockSideRef.current = newSide;

        // Nếu vuốt mạnh ra biên hoặc kéo sát cạnh màn hình (< 20px) -> Tự động thu gọn vào mép
        const closeToEdge =
          (isRightSide && finalX > screenWidth - ORB_SIZE - 20) ||
          (!isRightSide && finalX < 20) ||
          (isRightSide && gesture.vx > 0.5) ||
          (!isRightSide && gesture.vx < -0.5);

        if (closeToEdge) {
          isDockedRef.current = true;
          setIsDocked(true);
          const dockX = isRightSide ? screenWidth - DOCKED_PEEK : -(ORB_SIZE - DOCKED_PEEK);
          animateToPosition(dockX, finalY);
        } else {
          isDockedRef.current = false;
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
    outputRange: [isRight ? 80 : -80, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: routeOpacity,
          transform: [
            { translateX: routeSlideX },
            { scale: routeScale },
          ],
        },
      ]}
      pointerEvents={isHiddenRoute ? 'none' : 'box-none'}
    >
      <Animated.View
        style={{
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        }}
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
          <Feather name="message-square" size={13} color="#2563EB" style={{ marginRight: 6 }} />
          <Text
            numberOfLines={1}
            style={[styles.tooltipText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}
          >
            Nhấn để chat với TTN AI
          </Text>
          <Feather
            name={isRight ? 'arrow-right' : 'arrow-left'}
            size={12}
            color="#2563EB"
            style={{ marginLeft: 6 }}
          />
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

        {/* BÓNG TRÒN CHÍNH TRỢ LÝ AI */}
        <Pressable
          onPress={() => {
            if (isDockedRef.current) {
              handleUndockFromEdge();
            } else {
              handleOpenChat();
            }
          }}
          hitSlop={isDocked ? { top: 18, bottom: 18, left: 30, right: 30 } : 8}
          style={({ pressed }) => [styles.orbWrapper, pressed && styles.orbPressed]}
          accessibilityRole="button"
          accessibilityLabel={isDocked ? 'Chạm để mở chat bot' : 'Mở trợ lý ảo thông minh TTN AI'}
        >
          {/* Quả cầu Gradient sắc nét thay cho logo chữ nhỏ */}
          <LinearGradient
            colors={isDark ? ['#4F46E5', '#2563EB', '#0284C7'] : ['#6366F1', '#3B82F6', '#0EA5E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orb}
          >
            {/* Biểu tượng AI Sparkles thông minh, sang trọng chuẩn Gemini / Apple Intelligence */}
            <Ionicons
              name="sparkles"
              size={30}
              color="#FFFFFF"
            />
          </LinearGradient>

          {/* Chấm tròn báo AI Online (Chỉ hiện khi KHÔNG ẩn, nằm ngoài overflow: hidden nên nguyên vẹn 100% không bị cắt!) */}
          {!isDocked && (
            <Animated.View
              style={[
                styles.pulseDot,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}

          {/* Mũi tên gợi ý chạm để mở khi đang ẩn ở mép */}
          {isDocked && (
            <View style={[styles.dockedIndicator, isRight ? { left: 7 } : { right: 7 }]}>
              <Feather
                name={isRight ? 'chevron-left' : 'chevron-right'}
                size={18}
                color="#FFFFFF"
              />
            </View>
          )}
        </Pressable>
      </View>
      </Animated.View>
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
  orbWrapper: {
    position: 'relative',
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
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
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  orbPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }],
  },
  pulseDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.2,
    borderColor: '#FFFFFF',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  // Nút chủ động ẩn vào cạnh
  dockButton: {
    position: 'absolute',
    top: (ORB_SIZE - 32) / 2,
    width: 24,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  dockButtonRight: {
    right: -9,
  },
  dockButtonLeft: {
    left: -9,
  },
  // Khi ẩn vào cạnh
  dockedRight: {
    opacity: 0.94,
  },
  dockedLeft: {
    opacity: 0.94,
  },
  dockedIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 10,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bong bóng gợi ý (căn ngang song song với bóng chat, không bao giờ bị bóp méo)
  tooltipBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    minWidth: 180,
    maxWidth: 250,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  tooltipBubbleRight: {
    right: ORB_SIZE + 12,
    top: (ORB_SIZE - 40) / 2,
  },
  tooltipBubbleLeft: {
    left: ORB_SIZE + 12,
    top: (ORB_SIZE - 40) / 2,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
});
