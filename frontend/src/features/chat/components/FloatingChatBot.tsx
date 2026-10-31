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
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';

const ORB_SIZE = 58;
const EDGE_MARGIN = 8; // Khoảng cách cách mép màn hình khi bóng hít vào cạnh
const DOCKED_TAB_WIDTH = 36; // Chiều rộng tab mép khi bấm nút ẩn
const DOCKED_TAB_HEIGHT = 50; // Chiều cao tab mép

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

  // Trạng thái thu gọn mép khi chủ động bấm nút ẩn
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

  // Hiệu ứng scale nhún đàn hồi khi chạm / kéo
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Giới hạn vùng an toàn theo chiều dọc (tránh status bar và bottom nav)
  const minY = insets.top + 30;
  const maxY = screenHeight - insets.bottom - 105;
  const initialY = Math.max(minY, Math.min(maxY, screenHeight - insets.bottom - 170));
  const initialX = screenWidth - ORB_SIZE - EDGE_MARGIN;

  // Tọa độ vị trí của bóng (Dùng pan.getLayout() gán trực tiếp left & top trên Android)
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

  // Lắng nghe cập nhật tọa độ liên tục
  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPos.current = value;
    });
    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

  // Đảm bảo bóng không lọt màn hình khi xoay hướng
  useEffect(() => {
    const safeY = Math.max(minY, Math.min(maxY, currentPos.current.y));
    const safeX = isDockedRef.current
      ? (dockSideRef.current === 'right' ? screenWidth - DOCKED_TAB_WIDTH : 0)
      : (dockSideRef.current === 'right' ? screenWidth - ORB_SIZE - EDGE_MARGIN : EDGE_MARGIN);

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

  // 1. HIỆU ỨNG ẨN / THU GỌN VÀO MÉP KHI BẤM NÚT ẨN
  const handleDockToEdge = (sideArg?: 'left' | 'right') => {
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

    const targetX = isRight ? screenWidth - DOCKED_TAB_WIDTH : 0;
    const safeY = Math.max(minY, Math.min(maxY, currentPos.current.y));

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

  // 2. HIỆU ỨNG BUNG RA TỪ TAB MÉP (Chạm vào tab mép để bung ra lại)
  const handleUndockFromEdge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const isRight = dockSideRef.current === 'right';
    const targetX = isRight ? screenWidth - ORB_SIZE - EDGE_MARGIN : EDGE_MARGIN;
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

  // 3. CƠ CHẾ KÉO THẢ TỰ DO & TỰ ĐỘNG CHẠY VỀ CẠNH THEO CHIỀU NGANG Ở BẤT CỨ VỊ TRÍ NÀO
  const panResponder = useRef(
    PanResponder.create({
      // Bắt ngay lập tức khi ngón tay vừa chạm vào bóng
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

        // Nhấc bóng to lên 1.1 bám chặt ngón tay
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 5,
          tension: 120,
          useNativeDriver: false,
        }).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },

      onPanResponderMove: (_, gesture) => {
        // Cho phép kéo tự do đến bất cứ đâu trên màn hình
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
        if (moveDist < 7 && touchDuration < 300) {
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

        // ─── TRƯỜNG HỢP 2: KÉO THẢ -> TỰ ĐỘNG CHẠY VỀ CẠNH THEO CHIỀU NGANG TẠI VỊ TRÍ Y ĐÓ ───
        const finalX = currentPos.current.x;
        const finalY = currentPos.current.y;
        // Giữ nguyên độ cao Y bạn vừa thả (chỉ clamp an toàn)
        const safeY = Math.max(minY, Math.min(maxY, finalY));

        // Nhận diện mép cần hít vào theo hướng vẩy tay (fling vx) hoặc vị trí X
        let isRight = finalX + ORB_SIZE / 2 >= screenWidth / 2;
        if (gesture.vx > 0.3) isRight = true;
        if (gesture.vx < -0.3) isRight = false;

        const side = isRight ? 'right' : 'left';
        setDockSide(side);
        dockSideRef.current = side;

        // Tọa độ hít vào cạnh ngang (cách lề EDGE_MARGIN = 8px)
        const snapX = isRight ? screenWidth - ORB_SIZE - EDGE_MARGIN : EDGE_MARGIN;

        // Đảm bảo bóng luôn là quả bóng tròn hoàn chỉnh
        setIsDocked(false);
        isDockedRef.current = false;

        // CHẠY VÚT VỀ CẠNH THEO CHIỀU NGANG VÀ NẢY LÒ XO ĐÀN HỒI (MESSENGER BOUNCE)
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: snapX, y: safeY },
            bounciness: 11,
            speed: 15,
            useNativeDriver: false,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: false,
          }),
        ]).start();

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
        const snapX = isRight ? screenWidth - ORB_SIZE - EDGE_MARGIN : EDGE_MARGIN;
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

  // Nếu là route ẩn (Bản đồ, Cài đặt, Chat) thì không render để tránh bóng ma
  if (isHiddenRoute) {
    return null;
  }

  const isRight = dockSide === 'right';

  return (
    // DÙNG pan.getLayout() ĐỂ CẬP NHẬT TRỰC TIẾP LEFT & TOP TRÊN ANDROID NATIVE
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

      {/* ─── NÚT THU GỌN / ẨN VÀO MÉP (Bấm vào để chủ động thu gọn) ─── */}
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

      {/* ─── THÂN QUẢ BÓNG CHAT CHÍNH (GẮN TRỰC TIẾP PANRESPONDER ĐỂ KÉO SIÊU MƯỢT) ─── */}
      <View {...panResponder.panHandlers}>
        {isDocked ? (
          /* ═══ TRẠNG THÁI ẨN / THU GỌN VÀO MÉP ═══ */
          <LinearGradient
            colors={isDark ? ['#312E81', '#1D4ED8'] : ['#4338CA', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.dockedTab,
              isRight ? styles.dockedTabRight : styles.dockedTabLeft,
            ]}
          >
            <Image
              source={require('../../../../assets/images/favicon.png')}
              style={styles.dockedLogo}
              resizeMode="contain"
            />
            <Feather
              name={isRight ? 'chevron-left' : 'chevron-right'}
              size={12}
              color="#FFFFFF"
              style={{ marginTop: 2 }}
            />
          </LinearGradient>
        ) : (
          /* ═══ TRẠNG THÁI BÓNG TRÒN TỰ DO (CHẠY VỀ CẠNH THEO CHIỀU NGANG) ═══ */
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

              {/* Lớp phủ sáng bóng kính */}
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
  // Container khi ở chế độ bóng tròn tự do
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
  // Tab mép khi thu gọn
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
