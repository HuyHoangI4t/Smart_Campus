import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Image,
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
const DOCKED_TAB_WIDTH = 36; // Chiều rộng tab mép khi thu gọn (nằm hoàn toàn trong màn hình)
const DOCKED_TAB_HEIGHT = 50; // Chiều cao tab mép
const FREE_MARGIN = 12; // Khoảng cách tới mép màn hình khi nổi tự do

export function FloatingChatBot() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 1. Kiểm tra màn hình ẩn (Map, Settings, Chat)
  // Nếu ở màn hình ẩn thì return null ngay để không bị bóng ma trong suốt
  const isHiddenRoute = useMemo(() => {
    const path = (pathname || '').toLowerCase();
    const segs = (segments || []).map((s) => (typeof s === 'string' ? s.toLowerCase() : ''));

    if (path.includes('/map') || path === 'map' || segs.includes('map')) return true;
    if (path.includes('settings') || segs.includes('settings')) return true;
    if (path.includes('/chat') || path === 'chat' || segs.includes('chat')) return true;
    return false;
  }, [pathname, segments]);

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

  // Hiệu ứng scale nhún lò xo
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Giới hạn vùng an toàn theo chiều dọc
  const minY = insets.top + 35;
  const maxY = screenHeight - insets.bottom - 110;
  const initialY = Math.max(minY, Math.min(maxY, screenHeight - insets.bottom - 170));
  const initialX = screenWidth - ORB_SIZE - FREE_MARGIN;

  // Tọa độ vị trí: Dùng pan.getLayout() để Android cập nhật trực tiếp left & top của native View
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

  // Lắng nghe cập nhật tọa độ
  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPos.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

  // Kiểm tra an toàn màn hình khi xoay hướng
  useEffect(() => {
    const safeY = Math.max(minY, Math.min(maxY, currentPos.current.y));
    const safeX = isDockedRef.current
      ? (dockSideRef.current === 'right' ? screenWidth - DOCKED_TAB_WIDTH : 0)
      : (dockSideRef.current === 'right' ? screenWidth - ORB_SIZE - FREE_MARGIN : FREE_MARGIN);

    if (currentPos.current.x > screenWidth || currentPos.current.x < 0) {
      pan.setValue({ x: safeX, y: safeY });
    }
  }, [screenWidth, screenHeight, minY, maxY, pan]);

  // Mở màn hình chat
  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowTooltip(false);
    router.push('/(main)/chat' as any);
  };

  // 1. HIỆU ỨNG ẨN / THU GỌN VÀO MÉP MÀN HÌNH (Dock to Edge)
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

    // Tọa độ tab mép: Nằm gọn gàng sát mép tường màn hình (không để icon bị lọt ra ngoài)
    const targetX = isRight ? screenWidth - DOCKED_TAB_WIDTH : 0;
    const targetY = targetYArg !== undefined ? targetYArg : currentPos.current.y;
    const safeY = Math.max(minY, Math.min(maxY, targetY));

    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: targetX, y: safeY },
        bounciness: 6,
        speed: 15,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        friction: 6,
        tension: 80,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 2. HIỆU ỨNG BUNG MỞ RA KHỎI MÉP (Undock Spring Pop)
  const handleUndockFromEdge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const isRight = dockSideRef.current === 'right';
    const targetX = isRight ? screenWidth - ORB_SIZE - FREE_MARGIN : FREE_MARGIN;
    const safeY = Math.max(minY, Math.min(maxY, currentPos.current.y));

    setIsDocked(false);
    isDockedRef.current = false;

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

  // 3. CƠ CHẾ KÉO THẢ NATIVE MESSENGER (Không giật, chạm là bám tay)
  const panResponder = useRef(
    PanResponder.create({
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

        // Nhấc bóng to lên 1.12 bám tay ngay
        Animated.spring(scaleAnim, {
          toValue: 1.12,
          friction: 5,
          tension: 120,
          useNativeDriver: false,
        }).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },

      onPanResponderMove: (_, gesture) => {
        const currentItemWidth = isDockedRef.current ? DOCKED_TAB_WIDTH : ORB_SIZE;
        const minX = 0;
        const maxX = screenWidth - currentItemWidth;

        const currentX = Math.max(minX, Math.min(maxX, dragStartPos.current.x + gesture.dx));
        const currentY = Math.max(minY, Math.min(maxY, dragStartPos.current.y + gesture.dy));

        pan.setValue({ x: currentX, y: currentY });
      },

      onPanResponderRelease: (_, gesture) => {
        const moveDist = Math.hypot(gesture.dx, gesture.dy);
        const touchDuration = Date.now() - touchStartTime.current;

        // ─── TRƯỜNG HỢP 1: BẤM NHẸ (TAP) ───
        if (moveDist < 8 && touchDuration < 320) {
          Animated.spring(scaleAnim, {
            toValue: isDockedRef.current ? 0.96 : 1,
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

        let isRight = finalX + ORB_SIZE / 2 >= screenWidth / 2;
        if (gesture.vx > 0.35) isRight = true;
        if (gesture.vx < -0.35) isRight = false;

        const side = isRight ? 'right' : 'left';
        setDockSide(side);
        dockSideRef.current = side;

        // Vuốt cực mạnh hoặc thả sát mép (< 16px) -> Thu gọn vào mép
        const flingToEdge = (isRight && gesture.vx > 0.95) || (!isRight && gesture.vx < -0.95);
        const nearEdge = (isRight && finalX > screenWidth - ORB_SIZE - 16) || (!isRight && finalX < 16);

        if (flingToEdge || nearEdge) {
          handleDockToEdge(side, safeY);
        } else {
          // Bay vút vào lề nổi tự do kèm độ nảy lò xo (Messenger Spring Bounce)
          const snapX = isRight ? screenWidth - ORB_SIZE - FREE_MARGIN : FREE_MARGIN;
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
          toValue: isDockedRef.current ? 0.96 : 1,
          friction: 6,
          useNativeDriver: false,
        }).start();

        const isRight = currentPos.current.x + ORB_SIZE / 2 >= screenWidth / 2;
        const snapX = isRight ? screenWidth - ORB_SIZE - FREE_MARGIN : FREE_MARGIN;
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

  // Nếu là route ẩn thì không render
  if (isHiddenRoute) {
    return null;
  }

  const isRight = dockSide === 'right';

  return (
    // DÙNG pan.getLayout() ĐỂ CẬP NHẬT TRỰC TIẾP TỌA ĐỘ NATIVE VIEW TRÊN ANDROID
    <Animated.View
      style={[
        isDocked
          ? [styles.dockedWrapper, isRight ? styles.dockedWrapperRight : styles.dockedWrapperLeft]
          : styles.freeWrapper,
        pan.getLayout(),
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="box-none"
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
        </TouchableOpacity>
      )}

      {/* ─── NÚT THU GỌN / ẨN VÀO MÉP (Chỉ hiện khi mở tự do) ─── */}
      {!isDocked && (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => handleDockToEdge()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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

      {/* ─── THÂN BÓNG CHAT CHÍNH (XỬ LÝ RIÊNG BIỆT: KHI DOCKED VÀ KHI TỰ DO) ─── */}
      <View {...panResponder.panHandlers}>
        {isDocked ? (
          /* ═══ 1. TRẠNG THÁI THU GỌN VÀO MÉP (TAB MÉP) ═══ */
          /* Nằm gọn 100% trong màn hình, ICON LUÔN HIỂN THỊ RÕ RÀNG */
          <LinearGradient
            colors={isDark ? ['#312E81', '#1D4ED8'] : ['#4338CA', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.dockedTab,
              isRight ? styles.dockedTabRight : styles.dockedTabLeft,
            ]}
          >
            {/* Logo trường nhỏ xinh xắn trên tab mép */}
            <Image
              source={require('../../../../assets/images/favicon.png')}
              style={styles.dockedLogo}
              resizeMode="contain"
            />
            {/* Mũi tên chỉ thị hướng bung ra */}
            <Feather
              name={isRight ? 'chevron-left' : 'chevron-right'}
              size={12}
              color="#FFFFFF"
              style={{ marginTop: 2 }}
            />
          </LinearGradient>
        ) : (
          /* ═══ 2. TRẠNG THÁI MỞ TỰ DO (QUẢ BÓNG TRÒN) ═══ */
          /* Hiển thị đầy đủ Logo trường TTN, viền bóng kính & chấm online */
          <View style={styles.orb}>
            <LinearGradient
              colors={isDark ? ['#4338CA', '#2563EB', '#0284C7'] : ['#4F46E5', '#3B82F6', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientOrb}
            >
              {/* Logo chính thức Đại học Tây Nguyên */}
              <Image
                source={require('../../../../assets/images/favicon.png')}
                style={styles.freeLogo}
                resizeMode="cover"
              />

              {/* Lớp phủ sáng nhẹ tạo hiệu ứng bóng kính */}
              <View style={styles.glassRim} />
            </LinearGradient>

            {/* Chấm tròn báo trạng thái AI Online */}
            <Animated.View
              style={[
                styles.pulseDot,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Container khi ở chế độ mở tự do
  freeWrapper: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Container khi ở chế độ thu gọn mép
  dockedWrapper: {
    position: 'absolute',
    width: DOCKED_TAB_WIDTH,
    height: DOCKED_TAB_HEIGHT,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
  },
  dockedWrapperRight: {
    alignItems: 'flex-end',
  },
  dockedWrapperLeft: {
    alignItems: 'flex-start',
  },
  // Tab mép khi thu gọn (Docked Tab): Bo cong ôm sát mép tường, ICON NẰM Ở CHÍNH GIỮA
  dockedTab: {
    width: DOCKED_TAB_WIDTH,
    height: DOCKED_TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  dockedTabRight: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    paddingRight: 2,
  },
  dockedTabLeft: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
    paddingLeft: 2,
  },
  dockedLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  // Quả bóng chính khi mở tự do
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  gradientOrb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#2563EB',
  },
  freeLogo: {
    width: ORB_SIZE - 4,
    height: ORB_SIZE - 4,
    borderRadius: (ORB_SIZE - 4) / 2,
  },
  glassRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  // Nút bấm ẩn/thu gọn hình tròn nhỏ ở góc quả bóng
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
  // Tooltip gợi ý
  tooltipBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 160,
    maxWidth: 220,
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
    top: (ORB_SIZE - 32) / 2,
  },
  tooltipBubbleLeft: {
    left: ORB_SIZE + 10,
    top: (ORB_SIZE - 32) / 2,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
