import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

const ORB_SIZE = 58;
const DOCKED_PEEK = 26; // Độ nhô ra khỏi mép khi thu gọn (như tai thỏ)
const SIDE_MARGIN = 10; // Khoảng cách tới lề màn hình khi nổi tự do

export function FloatingChatBot() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 1. Kiểm tra màn hình ẩn (Map, Settings, Chat)
  const isHiddenRoute = useMemo(() => {
    const path = (pathname || '').toLowerCase();
    const segs = (segments || []).map((s) => (typeof s === 'string' ? s.toLowerCase() : ''));

    if (path.includes('/map') || path === 'map' || segs.includes('map')) return true;
    if (path.includes('settings') || segs.includes('settings')) return true;
    if (path.includes('/chat') || path === 'chat' || segs.includes('chat')) return true;
    return false;
  }, [pathname, segments]);

  // Hiệu ứng ẩn/hiện nhẹ nhàng khi chuyển trang
  const routeVisibilityAnim = useRef(new Animated.Value(isHiddenRoute ? 0 : 1)).current;
  useEffect(() => {
    Animated.spring(routeVisibilityAnim, {
      toValue: isHiddenRoute ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [isHiddenRoute, routeVisibilityAnim]);

  // Trạng thái thu gọn mép
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

  // Scale vật lý: Phóng to khi nhấc kéo, nảy lò xo khi va vào mép
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Giới hạn an toàn di chuyển theo trục Y
  const minY = insets.top + 40;
  const maxY = screenHeight - insets.bottom - 110;
  const initialY = Math.max(minY, Math.min(maxY, screenHeight - insets.bottom - 170));
  const initialX = screenWidth - ORB_SIZE - SIDE_MARGIN;

  // Tọa độ vị trí của quả bóng
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const currentPos = useRef({ x: initialX, y: initialY });
  const dragStartPos = useRef({ x: initialX, y: initialY });
  const touchStartTime = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const isDockedRef = useRef(false);
  const dockSideRef = useRef<'left' | 'right'>('right');

  useEffect(() => {
    isDockedRef.current = isDocked;
  }, [isDocked]);

  useEffect(() => {
    dockSideRef.current = dockSide;
  }, [dockSide]);

  // Lắng nghe thay đổi tọa độ
  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPos.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

  // Đảm bảo bóng không bị lọt khỏi màn hình khi kích thước thay đổi
  useEffect(() => {
    const safeY = Math.max(minY, Math.min(maxY, currentPos.current.y));
    const safeX = isDockedRef.current
      ? (dockSideRef.current === 'right' ? screenWidth - DOCKED_PEEK : -(ORB_SIZE - DOCKED_PEEK))
      : (dockSideRef.current === 'right' ? screenWidth - ORB_SIZE - SIDE_MARGIN : SIDE_MARGIN);

    if (currentPos.current.x > screenWidth || currentPos.current.x < -(ORB_SIZE - DOCKED_PEEK)) {
      pan.setValue({ x: safeX, y: safeY });
    }
  }, [screenWidth, screenHeight, minY, maxY, pan]);

  // Mở màn hình chat
  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowTooltip(false);
    router.push('/(main)/chat' as any);
  };

  // 1. HIỆU ỨNG ẨN / THU GỌN VÀO MÉP MÀN HÌNH (Edge Docking)
  const handleDockToEdge = (sideArg?: 'left' | 'right', targetYArg?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowTooltip(false);

    const isRight = sideArg
      ? sideArg === 'right'
      : currentPos.current.x + ORB_SIZE / 2 >= screenWidth / 2;
    const side = isRight ? 'right' : 'left';
    setDockSide(side);
    dockSideRef.current = side;
    setIsDocked(true);
    isDockedRef.current = true;

    // Vị trí nép mép (chỉ nhô ra DOCKED_PEEK px)
    const targetX = isRight ? screenWidth - DOCKED_PEEK : -(ORB_SIZE - DOCKED_PEEK);
    const targetY = targetYArg !== undefined ? targetYArg : currentPos.current.y;
    const safeY = Math.max(minY, Math.min(maxY, targetY));

    // Hiệu ứng lướt và nảy nhẹ vào mép
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: targetX, y: safeY },
        friction: 6,
        tension: 80,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.94,
        friction: 5,
        tension: 80,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 2. HIỆU ỨNG BUNG BẬT RA KHỎI MÉP (Spring Pop Out)
  const handleUndockFromEdge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const isRight = dockSideRef.current === 'right';
    const targetX = isRight ? screenWidth - ORB_SIZE - SIDE_MARGIN : SIDE_MARGIN;
    const safeY = Math.max(minY, Math.min(maxY, currentPos.current.y));

    setIsDocked(false);
    isDockedRef.current = false;

    // Bung nảy lò xo như Messenger
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: targetX, y: safeY },
        bounciness: 12,
        speed: 13,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 4,
          tension: 100,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      setShowTooltip(true);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 2500);
    });
  };

  // 3. CƠ CHẾ KÉO THẢ CHUẨN MESSENGER CHAT HEAD
  // Quả bóng bắt ngay cử chỉ khi chạm ngón tay vào, phân biệt 100% chính xác giữa Tap và Drag
  const panResponder = useRef(
    PanResponder.create({
      // BẮT NGAY LẬP TỨC khi ngón tay vừa chạm vào quả bóng (không có độ trễ)
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        isDragging.current = true;
        touchStartTime.current = Date.now();

        pan.stopAnimation((val) => {
          currentPos.current = val;
          dragStartPos.current = { x: val.x, y: val.y };
        });

        // Hiệu ứng nhấc bóng: scale to lên 1.12 bám chặt đầu ngón tay như Messenger
        Animated.spring(scaleAnim, {
          toValue: 1.12,
          friction: 5,
          tension: 120,
          useNativeDriver: false,
        }).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },

      onPanResponderMove: (_, gesture) => {
        // Cập nhật vị trí realtime theo ngón tay 1:1 mượt mà 60-120fps
        const minX = isDockedRef.current ? -(ORB_SIZE - DOCKED_PEEK) : 0;
        const maxX = isDockedRef.current ? screenWidth - DOCKED_PEEK : screenWidth - ORB_SIZE;

        const currentX = Math.max(minX, Math.min(maxX, dragStartPos.current.x + gesture.dx));
        const currentY = Math.max(minY, Math.min(maxY, dragStartPos.current.y + gesture.dy));

        pan.setValue({ x: currentX, y: currentY });
      },

      onPanResponderRelease: (_, gesture) => {
        const moveDist = Math.hypot(gesture.dx, gesture.dy);
        const touchDuration = Date.now() - touchStartTime.current;

        // ─── TRƯỜNG HỢP 1: CHẠM NHẸ / TAP (Không kéo hoặc kéo < 7px và nhấc tay trong 300ms) ───
        if (moveDist < 7 && touchDuration < 300) {
          Animated.spring(scaleAnim, {
            toValue: isDockedRef.current ? 0.94 : 1,
            friction: 5,
            tension: 90,
            useNativeDriver: false,
          }).start();

          if (isDockedRef.current) {
            handleUndockFromEdge();
          } else {
            handleOpenChat();
          }

          setTimeout(() => {
            isDragging.current = false;
          }, 80);
          return;
        }

        // ─── TRƯỜNG HỢP 2: KÉO THẢ (DRAG CHUẨN MESSENGER) ───
        const finalX = currentPos.current.x;
        const finalY = currentPos.current.y;
        const safeY = Math.max(minY, Math.min(maxY, finalY));

        // Phán đoán mép hít vào dựa trên vận tốc vẩy tay (fling velocity) hoặc nửa màn hình
        let isRight = finalX + ORB_SIZE / 2 >= screenWidth / 2;
        if (gesture.vx > 0.4) isRight = true;
        if (gesture.vx < -0.4) isRight = false;

        const side = isRight ? 'right' : 'left';
        setDockSide(side);
        dockSideRef.current = side;

        // Nếu vuốt cực nhanh ra mép hoặc thả sát mép (cách mép < 15px) -> Hít vào mép thu gọn (Dock)
        const flingToEdge = (isRight && gesture.vx > 0.9) || (!isRight && gesture.vx < -0.9);
        const nearEdge = (isRight && finalX > screenWidth - ORB_SIZE - 15) || (!isRight && finalX < 15);

        if (flingToEdge || nearEdge) {
          handleDockToEdge(side, safeY);
        } else {
          // Bay vút vào lề nổi tự do kèm HIỆU ỨNG LÒ XO NẢY TƯNG TƯNG (Spring Bounciness Messenger)
          const snapX = isRight ? screenWidth - ORB_SIZE - SIDE_MARGIN : SIDE_MARGIN;
          setIsDocked(false);
          isDockedRef.current = false;

          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: snapX, y: safeY },
              bounciness: 12,
              speed: 14,
              useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 6,
              tension: 80,
              useNativeDriver: false,
            }),
          ]).start();
        }

        setTimeout(() => {
          isDragging.current = false;
        }, 80);
      },

      onPanResponderTerminate: () => {
        Animated.spring(scaleAnim, {
          toValue: isDockedRef.current ? 0.94 : 1,
          friction: 6,
          useNativeDriver: false,
        }).start();

        const isRight = currentPos.current.x + ORB_SIZE / 2 >= screenWidth / 2;
        const snapX = isRight ? screenWidth - ORB_SIZE - SIDE_MARGIN : SIDE_MARGIN;
        Animated.spring(pan, {
          toValue: { x: snapX, y: Math.max(minY, Math.min(maxY, currentPos.current.y)) },
          bounciness: 10,
          speed: 12,
          useNativeDriver: false,
        }).start();

        isDragging.current = false;
      },
    })
  ).current;

  const isRight = dockSide === 'right';

  const routeScale = routeVisibilityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const routeOpacity = routeVisibilityAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.3, 1],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: routeOpacity,
          transform: [{ scale: routeScale }],
        },
      ]}
      pointerEvents={isHiddenRoute ? 'none' : 'box-none'}
    >
      <Animated.View
        style={[
          styles.floatingContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* ─── TOOLTIP GỢI Ý KHI VỪA BUNG RA ─── */}
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

        {/* ─── NÚT THU GỌN / ẨN VÀO MÉP (Nằm độc lập, bấm là thu gọn ngay tức thì) ─── */}
        {!isDocked && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleDockToEdge()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.dockButton,
              isRight ? styles.dockButtonRight : styles.dockButtonLeft,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Thu gọn bóng chat vào mép màn hình"
          >
            <Feather
              name={isRight ? 'chevron-right' : 'chevron-left'}
              size={13}
              color={isDark ? '#94A3B8' : '#475569'}
            />
          </TouchableOpacity>
        )}

        {/* ─── QUẢ BÓNG CHAT CHÍNH (Nhận PanResponder trực tiếp - Kéo cực mượt như Messenger) ─── */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.orbHitArea,
            isDocked && (isRight ? styles.dockedHitAreaRight : styles.dockedHitAreaLeft),
          ]}
        >
          {/* Vỏ Gradient của quả bóng / Tab mép */}
          <LinearGradient
            colors={isDark ? ['#4338CA', '#2563EB', '#0284C7'] : ['#4F46E5', '#3B82F6', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.orb,
              isDocked && (isRight ? styles.orbDockedRight : styles.orbDockedLeft),
            ]}
          >
            {/* Biểu tượng AI Sparkles */}
            <Ionicons
              name="sparkles"
              size={isDocked ? 20 : 27}
              color="#FFFFFF"
            />
          </LinearGradient>

          {/* Chấm tròn báo trạng thái AI Online (Ẩn khi đang thu gọn) */}
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

          {/* Mũi tên chỉ dẫn bung ra khi đang nép ở mép */}
          {isDocked && (
            <View style={[styles.dockedIndicator, isRight ? { left: 4 } : { right: 4 }]}>
              <Feather
                name={isRight ? 'chevron-left' : 'chevron-right'}
                size={13}
                color="#FFFFFF"
              />
            </View>
          )}
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
  floatingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Vùng cảm ứng của quả bóng (Kích thước đầy đủ để ngón tay chạm phát dính ngay)
  orbHitArea: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockedHitAreaRight: {
    alignItems: 'flex-start',
  },
  dockedHitAreaLeft: {
    alignItems: 'flex-end',
  },
  // Quả bóng gradient chính
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
    elevation: 10,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  // Nẹp mép phải
  orbDockedRight: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: ORB_SIZE / 2,
    borderBottomLeftRadius: ORB_SIZE / 2,
    borderRightWidth: 0,
  },
  // Nẹp mép trái
  orbDockedLeft: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: ORB_SIZE / 2,
    borderBottomRightRadius: ORB_SIZE / 2,
    borderLeftWidth: 0,
  },
  // Chấm đèn xanh online
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  // Nút bấm ẩn/thu gọn hình capsule độc lập ở mép quả bóng
  dockButton: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  dockButtonRight: {
    right: -4,
  },
  dockButtonLeft: {
    left: -4,
  },
  // Mũi tên chỉ thị trên tab mép khi thu gọn
  dockedIndicator: {
    position: 'absolute',
    top: (ORB_SIZE - 18) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 9,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tooltip gợi ý
  tooltipBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    minWidth: 175,
    maxWidth: 240,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  tooltipBubbleRight: {
    right: ORB_SIZE + 10,
    top: (ORB_SIZE - 36) / 2,
  },
  tooltipBubbleLeft: {
    left: ORB_SIZE + 10,
    top: (ORB_SIZE - 36) / 2,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
