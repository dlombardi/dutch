import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '../lib/logger';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => () => void;
  setNetworkState: (state: NetInfoState, previousState: { isConnected: boolean; isInternetReachable: boolean | null }) => void;
}

// Callback for when device comes online
let onOnlineCallback: (() => void) | null = null;

export function setOnOnlineCallback(callback: () => void) {
  onOnlineCallback = callback;
}

/**
 * Get current network status without importing the store directly.
 * This allows other modules to check network status without creating
 * a direct store dependency. (P2-002 fix: decoupled network status access)
 */
export function getNetworkStatus(): { isConnected: boolean; isInternetReachable: boolean | null } {
  const state = useNetworkStore.getState();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
  };
}

/**
 * Check if the device is currently offline.
 * Convenience function for the common offline check pattern.
 */
export function isOffline(): boolean {
  const { isConnected, isInternetReachable } = getNetworkStatus();
  return !isConnected || isInternetReachable === false;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true, // Assume connected initially
  isInternetReachable: null,
  connectionType: null,
  isInitialized: false,

  initialize: () => {
    // Get current state immediately
    NetInfo.fetch().then((state) => {
      get().setNetworkState(state, { isConnected: true, isInternetReachable: null });
      set({ isInitialized: true });
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const { isConnected: wasConnected, isInternetReachable: wasReachable } = get();
      get().setNetworkState(state, { isConnected: wasConnected, isInternetReachable: wasReachable });
    });

    return unsubscribe;
  },

  setNetworkState: (state: NetInfoState, previousState) => {
    const isNowOnline = state.isConnected && state.isInternetReachable !== false;
    const wasOffline = !previousState.isConnected || previousState.isInternetReachable === false;

    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });

    // Trigger callback if we just came online
    if (isNowOnline && wasOffline && onOnlineCallback) {
      logger.info('Device came online, triggering sync', { category: 'network' });
      onOnlineCallback();
    }
  },
}));
