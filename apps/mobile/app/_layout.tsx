import { useEffect, useState } from 'react';
import { Slot, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { useNetworkStore } from '../stores/networkStore';

function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStore();

  // Show banner when offline or internet is not reachable
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) return null;

  return (
    <View
      style={{
        backgroundColor: '#f59e0b',
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#78350f', fontWeight: '600', fontSize: 14 }}>
        You're offline. Data shown may be outdated.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { connect, disconnect } = useSyncStore();
  const { initialize: initializeNetwork } = useNetworkStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize network monitoring
  useEffect(() => {
    const unsubscribe = initializeNetwork();
    return unsubscribe;
  }, []);

  // Connect/disconnect WebSocket based on auth state
  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, _hasHydrated]);

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
      <OfflineBanner />
      <Slot />
    </SafeAreaProvider>
  );
}
