import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const [loadingText, setLoadingText] = useState('Đang khởi tạo hệ thống...');

  // Animation values
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 750,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Gentle pulsing halo animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Status text progression
    const timer1 = setTimeout(() => {
      setLoadingText('Đang kiểm tra phiên làm việc...');
    }, 400);

    const timer2 = setTimeout(() => {
      setLoadingText('Đang đồng bộ dữ liệu sinh viên...');
    }, 900);

    // 4. Session verification & navigation
    let isMounted = true;
    const checkAuthSession = async () => {
      const startTime = Date.now();
      try {
        const [token, userStr] = await Promise.all([
          AsyncStorage.getItem('@auth_token'),
          AsyncStorage.getItem('@auth_user'),
        ]);

        // Đảm bảo màn hình hiển thị tối thiểu 1500ms tạo cảm giác mượt mà, không bị chớp giật
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
          await new Promise((r) => setTimeout(r, 1500 - elapsed));
        }

        if (!isMounted) return;

        if (userStr) {
          const user = JSON.parse(userStr);
          if ((user?.mssv && user.mssv !== 'guest') || token) {
            router.replace('/(main)/home');
            return;
          }
        }
        router.replace('/(auth)');
      } catch (err) {
        console.warn('Lỗi kiểm tra phiên làm việc:', err);
        if (isMounted) router.replace('/(auth)');
      }
    };

    checkAuthSession();

    return () => {
      isMounted = false;
      pulseLoop.stop();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Nền Gradient chuyên nghiệp Deep Sapphire -> Midnight Navy */}
      <LinearGradient
        colors={['#070D1F', '#0F1E42', '#152C63', '#0A132C']}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Quầng sáng trang trí mềm mại phía sau Logo */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            transform: [{ scale: pulseAnim }],
            opacity: 0.25,
          },
        ]}
      />

      {/* Khối trung tâm: Logo trường & Thương hiệu */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/favicon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.titleWrapper, { opacity: contentFade }]}>
          <Text style={styles.appTitle}>SMART CAMPUS</Text>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.schoolTitle}>ĐẠI HỌC TÂY NGUYÊN</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.mottoText}>TAY NGUYEN UNIVERSITY • EST. 1977</Text>
        </Animated.View>
      </View>

      {/* Khối trạng thái nạp phía dưới */}
      <Animated.View style={[styles.bottomContent, { opacity: contentFade }]}>
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#60A5FA" style={styles.spinner} />
          <Text style={styles.statusText}>{loadingText}</Text>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerVersion}>Hệ sinh thái số sinh viên • v1.0.0</Text>
          <Text style={styles.footerCopyright}>Bản quyền © Trường Đại học Tây Nguyên</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: '#3B82F6',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  logoWrapper: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleWrapper: {
    alignItems: 'center',
    marginTop: 22,
  },
  appTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(59, 130, 246, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  dividerLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(147, 197, 253, 0.4)',
  },
  schoolTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 2,
  },
  mottoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 42,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
  },
  spinner: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 3,
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  footerCopyright: {
    fontSize: 10,
    fontWeight: '400',
    color: '#475569',
  },
});
