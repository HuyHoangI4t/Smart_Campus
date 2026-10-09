import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { requestAppStartupStoragePermission } from '../src/services/permissionService';

export default function RootLayout() {
  useEffect(() => {
    // Tự động yêu cầu quyền bộ nhớ / lưu trữ khi mở app
    requestAppStartupStoragePermission();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </SafeAreaProvider>
  );
}