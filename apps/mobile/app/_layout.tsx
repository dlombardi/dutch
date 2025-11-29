import { useEffect, useState } from 'react';
import { Slot, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't navigate until:
    // 1. Component is mounted
    // 2. Router is ready
    // 3. Auth store has rehydrated from storage
    if (!isMounted || !navigationState?.key || !_hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAuthVerify = segments[0] === 'auth' && (segments as string[])[1] === 'verify';

    // Allow access to auth/verify route (for magic link deep links)
    if (inAuthVerify) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, navigationState?.key, isMounted, _hasHydrated]);

  // Show loading while waiting for hydration
  if (!_hasHydrated) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaProvider>
  );
}
