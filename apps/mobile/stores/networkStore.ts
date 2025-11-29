import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => () => void;
  setNetworkState: (state: NetInfoState) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true, // Assume connected initially
  isInternetReachable: null,
  connectionType: null,
  isInitialized: false,

  initialize: () => {
    // Get current state immediately
    NetInfo.fetch().then((state) => {
      get().setNetworkState(state);
      set({ isInitialized: true });
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      get().setNetworkState(state);
    });

    return unsubscribe;
  },

  setNetworkState: (state: NetInfoState) => {
    set({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.type,
    });
  },
}));
