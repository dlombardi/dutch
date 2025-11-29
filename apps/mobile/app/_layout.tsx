import { useEffect, useState } from 'react';
import { Slot, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { useNetworkStore, setOnOnlineCallback } from '../stores/networkStore';
import { useExpensesStore } from '../stores/expensesStore';

function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStore();
  const { pendingExpenses, isSyncing } = useExpensesStore();

  // Show banner when offline or internet is not reachable
  const isOffline = !isConnected || isInternetReachable === false;
  const hasPending = pendingExpenses.length > 0;

  if (!isOffline && !hasPending) return null;

  let message = "You're offline. Data shown may be outdated.";
  let bgColor = '#f59e0b';
  let textColor = '#78350f';

  if (hasPending && !isOffline) {
    if (isSyncing) {
      message = `Syncing ${pendingExpenses.length} pending expense${pendingExpenses.length > 1 ? 's' : ''}...`;
      bgColor = '#3b82f6';
      textColor = '#ffffff';
    } else {
      message = `${pendingExpenses.length} expense${pendingExpenses.length > 1 ? 's' : ''} pending sync`;
      bgColor = '#f59e0b';
      textColor = '#78350f';
    }
  } else if (hasPending && isOffline) {
    message = `Offline - ${pendingExpenses.length} expense${pendingExpenses.length > 1 ? 's' : ''} will sync when online`;
  }

  return (
    <View
      style={{
        backgroundColor: bgColor,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isSyncing && (
        <ActivityIndicator size="small" color={textColor} style={{ marginRight: 8 }} />
      )}
      <Text style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>
        {message}
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
  const { syncPendingExpenses } = useExpensesStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize network monitoring and set up online sync callback
  useEffect(() => {
    // Set up callback to sync pending expenses when coming online
    setOnOnlineCallback(() => {
      syncPendingExpenses();
    });

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
