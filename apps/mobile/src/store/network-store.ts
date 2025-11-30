/**
 * Network Store
 * Zustand store for tracking network connectivity
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '@/lib/utils/logger';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isInitialized: boolean;

  initialize: () => () => void;
  setNetworkState: (
    state: NetInfoState,
    previousState: { isConnected: boolean; isInternetReachable: boolean | null }
  ) => void;
}

// Callback for when device comes online
let onOnlineCallback: (() => void) | null = null;

export function setOnOnlineCallback(callback: () => void) {
  onOnlineCallback = callback;
}

/**
 * Get current network status without importing the store directly.
 */
export function getNetworkStatus(): {
  isConnected: boolean;
  isInternetReachable: boolean | null;
} {
  const state = useNetworkStore.getState();
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
  };
}

/**
 * Check if the device is currently offline.
 */
export function isOffline(): boolean {
  const { isConnected, isInternetReachable } = getNetworkStatus();
  return !isConnected || isInternetReachable === false;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isInternetReachable: null,
  connectionType: null,
  isInitialized: false,

  initialize: () => {
    NetInfo.fetch().then((state) => {
      get().setNetworkState(state, { isConnected: true, isInternetReachable: null });
      set({ isInitialized: true });
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const { isConnected: wasConnected, isInternetReachable: wasReachable } = get();
      get().setNetworkState(state, {
        isConnected: wasConnected,
        isInternetReachable: wasReachable,
      });
    });

    return unsubscribe;
  },

  setNetworkState: (state: NetInfoState, previousState) => {
    const isNowOnline =
      state.isConnected && state.isInternetReachable !== false;
    const wasOffline =
      !previousState.isConnected || previousState.isInternetReachable === false;

    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });

    if (isNowOnline && wasOffline && onOnlineCallback) {
      logger.info('Device came online, triggering sync', { category: 'network' });
      onOnlineCallback();
    }
  },
}));
