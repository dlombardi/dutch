import '../global.css';

import { useCallback, useEffect, useState } from 'react';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { setOnOnlineCallback, useNetworkStore } from '../stores/networkStore';
import { useExpensesStore } from '../stores/expensesStore';
import { colors } from '../lib/theme';

// Offline banner as a pure presentational component (no hooks)
function OfflineBannerView({
  isConnected,
  isInternetReachable,
  pendingCount,
  isSyncing,
}: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  pendingCount: number;
  isSyncing: boolean;
}) {
  const isOffline = !isConnected || isInternetReachable === false;
  const hasPending = pendingCount > 0;

  if (!isOffline && !hasPending) return null;

  let message = "You're offline. Data shown may be outdated.";
  let bgColor: string = colors.warning.DEFAULT;
  let textColor: string = colors.warning[900];

  if (hasPending && !isOffline) {
    if (isSyncing) {
      message = `Syncing ${pendingCount} pending expense${pendingCount > 1 ? 's' : ''}...`;
      bgColor = colors.info.DEFAULT;
      textColor = colors.text.inverse;
    } else {
      message = `${pendingCount} expense${pendingCount > 1 ? 's' : ''} pending sync`;
    }
  } else if (hasPending && isOffline) {
    message = `Offline - ${pendingCount} expense${pendingCount > 1 ? 's' : ''} will sync when online`;
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

// Loading screen component (no hooks)
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.DEFAULT }}>
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
    </View>
  );
}

// Main app content with Stack navigator
function AppContent({
  isConnected,
  isInternetReachable,
  pendingCount,
  isSyncing,
}: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  pendingCount: number;
  isSyncing: boolean;
}) {
  return (
    <>
      <StatusBar style="auto" />
      <OfflineBannerView
        isConnected={isConnected}
        isInternetReachable={isInternetReachable}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
      />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background.DEFAULT,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/verify" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-group"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            headerBackTitle: 'Groups',
          }}
        />
        <Stack.Screen
          name="group/[id]/add-expense"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="expense/[id]" />
        <Stack.Screen
          name="expense/[id]/edit"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="join/[code]"
          options={{
            title: 'Join Group',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // ALL hooks must be called unconditionally at the top
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [isMounted, setIsMounted] = useState(false);

  // Zustand store hooks - called unconditionally
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const connect = useSyncStore((state) => state.connect);
  const disconnect = useSyncStore((state) => state.disconnect);
  const initializeNetwork = useNetworkStore((state) => state.initialize);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isInternetReachable = useNetworkStore((state) => state.isInternetReachable);
  const syncPendingExpenses = useExpensesStore((state) => state.syncPendingExpenses);
  const pendingExpenses = useExpensesStore((state) => state.pendingExpenses);
  const isSyncing = useExpensesStore((state) => state.isSyncing);

  // Memoize callbacks to avoid re-creating functions
  const handleOnline = useCallback(() => {
    syncPendingExpenses();
  }, [syncPendingExpenses]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize network monitoring
  useEffect(() => {
    setOnOnlineCallback(handleOnline);
    const unsubscribe = initializeNetwork();
    return unsubscribe;
  }, [initializeNetwork, handleOnline]);

  // Connect/disconnect WebSocket based on auth state
  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, _hasHydrated, connect, disconnect]);

  // Navigation effect
  useEffect(() => {
    if (!isMounted || !navigationState?.key || !_hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAuthVerify = segments[0] === 'auth' && (segments as string[])[1] === 'verify';

    if (inAuthVerify) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, navigationState?.key, isMounted, _hasHydrated]);

  // Always render SafeAreaProvider - switch content based on hydration state
  return (
    <QueryClientProvider client={getQueryClient()}>
      <SafeAreaProvider>
        {!_hasHydrated ? (
          <LoadingScreen />
        ) : (
          <AppContent
            isConnected={isConnected}
            isInternetReachable={isInternetReachable}
            pendingCount={pendingExpenses.length}
            isSyncing={isSyncing}
          />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
