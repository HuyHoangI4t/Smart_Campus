import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '../src/constants/appColors';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const checkAuthSession = async () => {
      try {
        const [token, userStr] = await Promise.all([
          AsyncStorage.getItem('@auth_token'),
          AsyncStorage.getItem('@auth_user'),
        ]);

        if (!isMounted) return;

        if (userStr) {
          const user = JSON.parse(userStr);
          // Nếu đã đăng nhập tài khoản sinh viên hợp lệ hoặc có JWT token
          if ((user?.mssv && user.mssv !== 'guest') || token) {
            router.replace('/(main)/home');
            return;
          }
        }
        router.replace('/(auth)');
      } catch {
        if (isMounted) router.replace('/(auth)');
      }
    };

    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}
