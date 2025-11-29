import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

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
      console.log('[Network] Device came online, triggering sync');
      onOnlineCallback();
    }
  },
}));
