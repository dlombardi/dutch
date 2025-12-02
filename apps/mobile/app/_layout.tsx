import '../global.css';

import { useCallback, useEffect, useState } from 'react';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Appearance, Text, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { getQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/modules/auth';
import { useSyncStore } from '@/store/sync-store';
import { setOnOnlineCallback, useNetworkStore } from '@/store/network-store';
import { useOfflineQueueStore } from '@/store/offline-queue-store';
import { useThemeStore } from '@/store/theme-store';
import { colors } from '@/constants/theme';
import { UpgradePromptBanner } from '@/components/ui';

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
  let bgColor = '#F59E0B'; // warning orange
  let textColor = '#78350F'; // dark warning

  if (hasPending && !isOffline) {
    if (isSyncing) {
      message = `Syncing ${pendingCount} pending expense${pendingCount > 1 ? 's' : ''}...`;
      bgColor = colors.dark.blue;
      textColor = '#FFFFFF';
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

// Loading screen component
function LoadingScreen({ isDark }: { isDark: boolean }) {
  const themeColors = isDark ? colors.dark : colors.light;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.bg }}>
      <ActivityIndicator size="large" color={themeColors.orange} />
    </View>
  );
}

// Main app content with Stack navigator
function AppContent({
  isConnected,
  isInternetReachable,
  pendingCount,
  isSyncing,
  isDark,
  showUpgradePrompt,
  onClaimAccount,
  onDismissUpgradePrompt,
}: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  pendingCount: number;
  isSyncing: boolean;
  isDark: boolean;
  showUpgradePrompt: boolean;
  onClaimAccount: () => void;
  onDismissUpgradePrompt: () => void;
}) {
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBannerView
        isConnected={isConnected}
        isInternetReachable={isInternetReachable}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
      />
      {showUpgradePrompt && (
        <UpgradePromptBanner
          onClaim={onClaimAccount}
          onDismiss={onDismissUpgradePrompt}
          isDark={isDark}
        />
      )}
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: themeColors.bgElevated,
          },
          headerTintColor: themeColors.textPrimary,
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
  const { colorScheme, setColorScheme } = useColorScheme();

  // Zustand store hooks - called unconditionally
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const showUpgradePrompt = useAuthStore((state) => state.showUpgradePrompt);
  const user = useAuthStore((state) => state.user);
  const dismissUpgradePrompt = useAuthStore((state) => state.dismissUpgradePrompt);
  const connect = useSyncStore((state) => state.connect);
  const disconnect = useSyncStore((state) => state.disconnect);
  const initializeNetwork = useNetworkStore((state) => state.initialize);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isInternetReachable = useNetworkStore((state) => state.isInternetReachable);
  const syncPendingExpenses = useOfflineQueueStore((state) => state.syncPendingExpenses);
  const pendingExpenses = useOfflineQueueStore((state) => state.pendingExpenses);
  const isSyncing = useOfflineQueueStore((state) => state.isSyncing);
  const themePreference = useThemeStore((state) => state.preference);
  const themeHasHydrated = useThemeStore((state) => state._hasHydrated);

  // Determine if we're in dark mode
  const isDark = colorScheme === 'dark';

  // Memoize callbacks to avoid re-creating functions
  const handleOnline = useCallback(() => {
    syncPendingExpenses();
  }, [syncPendingExpenses]);

  const handleClaimAccount = useCallback(() => {
    // Navigate to settings where the user can add their email
    router.push('/(tabs)/settings');
  }, []);

  const handleDismissUpgradePrompt = useCallback(() => {
    Alert.alert(
      'Dismiss Reminder',
      'You can always add your email later in Settings.',
      [
        { text: 'Keep Showing', style: 'cancel' },
        { text: 'Dismiss', onPress: dismissUpgradePrompt },
      ]
    );
  }, [dismissUpgradePrompt]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply theme preference when it changes
  useEffect(() => {
    if (!themeHasHydrated) return;

    if (themePreference === 'system') {
      // Use system preference
      const systemScheme = Appearance.getColorScheme() || 'dark';
      setColorScheme(systemScheme);
    } else {
      // Use explicit preference
      setColorScheme(themePreference);
    }
  }, [themePreference, themeHasHydrated, setColorScheme]);

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
          <LoadingScreen isDark={isDark} />
        ) : (
          <AppContent
            isConnected={isConnected}
            isInternetReachable={isInternetReachable}
            pendingCount={pendingExpenses.length}
            isSyncing={isSyncing}
            isDark={isDark}
            showUpgradePrompt={showUpgradePrompt && user?.type === 'guest'}
            onClaimAccount={handleClaimAccount}
            onDismissUpgradePrompt={handleDismissUpgradePrompt}
          />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
