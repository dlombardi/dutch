import "../global.css";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  router,
  Stack,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, Alert, Appearance } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import DropdownAlert, { DropdownAlertData } from "react-native-dropdownalert";
import { getQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/modules/auth";
import { useSyncStore } from "@/store/sync-store";
import { setOnOnlineCallback, useNetworkStore } from "@/store/network-store";
import { useOfflineQueueStore } from "@/store/offline-queue-store";
import { useThemeStore } from "@/store/theme-store";
import { colors } from "@/constants/theme";
import { UpgradePromptBannerContent } from "@/components/ui";
import { View, Text } from "@/components/ui/primitives";

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
  let bgClass = "bg-amber-500";
  let textClass = "text-amber-900";

  if (hasPending && !isOffline) {
    if (isSyncing) {
      message = `Syncing ${pendingCount} pending expense${pendingCount > 1 ? "s" : ""}...`;
      bgClass = "bg-blue-500";
      textClass = "text-white";
    } else {
      message = `${pendingCount} expense${pendingCount > 1 ? "s" : ""} pending sync`;
    }
  } else if (hasPending && isOffline) {
    message = `Offline - ${pendingCount} expense${pendingCount > 1 ? "s" : ""} will sync when online`;
  }

  return (
    <View
      className={`${bgClass} py-2 px-4 flex-row justify-center items-center`}
    >
      {isSyncing && (
        <ActivityIndicator
          size="small"
          color={textClass === "text-white" ? "#FFFFFF" : "#78350F"}
          style={{ marginRight: 8 }}
        />
      )}
      <Text className={`${textClass} font-semibold text-sm`}>{message}</Text>
    </View>
  );
}

// Loading screen component
function LoadingScreen({ isDark }: { isDark: boolean }) {
  const themeColors = isDark ? colors.dark : colors.light;
  return (
    <View
      className={`flex-1 justify-center items-center ${isDark ? "bg-dark-bg" : "bg-light-bg"}`}
    >
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
  onSwipeDismiss,
}: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  pendingCount: number;
  isSyncing: boolean;
  isDark: boolean;
  showUpgradePrompt: boolean;
  onClaimAccount: () => void;
  onDismissUpgradePrompt: () => void;
  onSwipeDismiss: () => void;
}) {
  const themeColors = isDark ? colors.dark : colors.light;
  const alertRef = useRef<
    ((data?: DropdownAlertData) => Promise<DropdownAlertData>) | undefined
  >(undefined);
  const alertShownRef = useRef(false);

  // Trigger alert when showUpgradePrompt becomes true
  useEffect(() => {
    if (showUpgradePrompt && alertRef.current && !alertShownRef.current) {
      alertShownRef.current = true;
      alertRef.current({
        type: "info",
        title: "",
        message: "",
      });
    } else if (!showUpgradePrompt) {
      alertShownRef.current = false;
    }
  }, [showUpgradePrompt]);

  // Handle claim button - dismiss alert then navigate
  const handleClaimPress = useCallback(() => {
    alertShownRef.current = false;
    onClaimAccount();
  }, [onClaimAccount]);

  return (
    <View className="flex-1">
      <StatusBar style={isDark ? "light" : "dark"} />
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
            backgroundColor: themeColors.bgElevated,
          },
          headerTintColor: themeColors.textPrimary,
          contentStyle: {
            backgroundColor: themeColors.bg,
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
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            headerBackTitle: "Groups",
          }}
        />
        <Stack.Screen
          name="group/[id]/add-expense"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen name="expense/[id]" />
        <Stack.Screen
          name="expense/[id]/edit"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="join/[code]"
          options={{
            title: "Join Group",
          }}
        />
        <Stack.Screen
          name="claim-account"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
      <DropdownAlert
        alert={(func) => (alertRef.current = func)}
        dismissInterval={0}
        panResponderEnabled={true}
        onDismissPanResponder={() => {
          alertShownRef.current = false;
          onSwipeDismiss();
        }}
        onDismissCancel={() => {
          alertShownRef.current = false;
        }}
        alertViewStyle={{
          backgroundColor: themeColors.blue,
          paddingTop: 50,
          paddingBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <UpgradePromptBannerContent
          onClaim={handleClaimPress}
          onDismiss={onDismissUpgradePrompt}
        />
      </DropdownAlert>
    </View>
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
  const dismissUpgradePrompt = useAuthStore(
    (state) => state.dismissUpgradePrompt,
  );
  const connect = useSyncStore((state) => state.connect);
  const disconnect = useSyncStore((state) => state.disconnect);
  const initializeNetwork = useNetworkStore((state) => state.initialize);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isInternetReachable = useNetworkStore(
    (state) => state.isInternetReachable,
  );
  const syncPendingExpenses = useOfflineQueueStore(
    (state) => state.syncPendingExpenses,
  );
  const pendingExpenses = useOfflineQueueStore(
    (state) => state.pendingExpenses,
  );
  const isSyncing = useOfflineQueueStore((state) => state.isSyncing);
  const themePreference = useThemeStore((state) => state.preference);
  const themeHasHydrated = useThemeStore((state) => state._hasHydrated);

  // Determine if we're in dark mode
  const isDark = colorScheme === "dark";

  // Memoize callbacks to avoid re-creating functions
  const handleOnline = useCallback(() => {
    syncPendingExpenses();
  }, [syncPendingExpenses]);

  const handleClaimAccount = useCallback(() => {
    // Navigate to settings where the user can add their email
    router.push("/(tabs)/settings");
  }, []);

  const handleDismissUpgradePrompt = useCallback(() => {
    Alert.alert(
      "Dismiss Reminder",
      "You can always add your email later in Settings.",
      [
        { text: "Keep Showing", style: "cancel" },
        { text: "Dismiss", onPress: dismissUpgradePrompt },
      ],
    );
  }, [dismissUpgradePrompt]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply theme preference when it changes
  useEffect(() => {
    if (!themeHasHydrated) return;

    if (themePreference === "system") {
      // Use system preference
      const systemScheme = Appearance.getColorScheme() || "dark";
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

    const inAuthGroup = segments[0] === "(auth)";
    const inAuthVerify =
      segments[0] === "auth" && (segments as string[])[1] === "verify";

    if (inAuthVerify) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [
    isAuthenticated,
    segments,
    navigationState?.key,
    isMounted,
    _hasHydrated,
  ]);

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
            showUpgradePrompt={showUpgradePrompt && user?.type === "guest"}
            onClaimAccount={handleClaimAccount}
            onDismissUpgradePrompt={handleDismissUpgradePrompt}
            onSwipeDismiss={dismissUpgradePrompt}
          />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
