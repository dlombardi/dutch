import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Match the API configuration
const WS_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.evn.app';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface SyncState {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  socketId: string | null;
  subscribedGroups: Set<string>;
  lastError: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;

  // Event listeners
  onExpenseCreated: (callback: (data: any) => void) => () => void;
  onExpenseUpdated: (callback: (data: any) => void) => () => void;
  onExpenseDeleted: (callback: (data: any) => void) => () => void;
  onSettlementCreated: (callback: (data: any) => void) => () => void;
  onBalancesUpdated: (callback: (data: any) => void) => () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  socket: null,
  connectionStatus: 'disconnected',
  socketId: null,
  subscribedGroups: new Set(),
  lastError: null,

  connect: () => {
    const { socket } = get();

    // Already connected or connecting
    if (socket?.connected) {
      return;
    }

    set({ connectionStatus: 'connecting', lastError: null });

    const newSocket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('[Sync] Connected to server');
      set({ connectionStatus: 'connected' });
    });

    newSocket.on('welcome', (data: { message: string; socketId: string }) => {
      console.log('[Sync] Welcome:', data.message);
      set({ socketId: data.socketId });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Sync] Disconnected:', reason);
      set({ connectionStatus: 'disconnected', socketId: null });
    });

    newSocket.on('connect_error', (error) => {
      console.log('[Sync] Connection error:', error.message);
      set({ lastError: error.message, connectionStatus: 'disconnected' });
    });

    newSocket.io.on('reconnect_attempt', () => {
      console.log('[Sync] Attempting to reconnect...');
      set({ connectionStatus: 'reconnecting' });
    });

    newSocket.io.on('reconnect', () => {
      console.log('[Sync] Reconnected');
      set({ connectionStatus: 'connected' });

      // Rejoin all previously subscribed groups
      const { subscribedGroups } = get();
      subscribedGroups.forEach((groupId) => {
        newSocket.emit('joinGroup', { groupId }, (response: any) => {
          console.log(`[Sync] Rejoined group ${groupId}:`, response.success);
        });
      });
    });

    newSocket.io.on('reconnect_failed', () => {
      console.log('[Sync] Reconnection failed');
      set({ connectionStatus: 'disconnected', lastError: 'Failed to reconnect' });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        connectionStatus: 'disconnected',
        socketId: null,
        subscribedGroups: new Set(),
      });
    }
  },

  joinGroup: async (groupId: string): Promise<boolean> => {
    const { socket, subscribedGroups } = get();

    if (!socket?.connected) {
      console.warn('[Sync] Cannot join group - not connected');
      return false;
    }

    return new Promise((resolve) => {
      socket.emit('joinGroup', { groupId }, (response: { success: boolean; groupId: string }) => {
        if (response.success) {
          const newGroups = new Set(subscribedGroups);
          newGroups.add(groupId);
          set({ subscribedGroups: newGroups });
          console.log(`[Sync] Joined group ${groupId}`);
        }
        resolve(response.success);
      });
    });
  },

  leaveGroup: async (groupId: string): Promise<boolean> => {
    const { socket, subscribedGroups } = get();

    if (!socket?.connected) {
      console.warn('[Sync] Cannot leave group - not connected');
      return false;
    }

    return new Promise((resolve) => {
      socket.emit('leaveGroup', { groupId }, (response: { success: boolean; groupId: string }) => {
        if (response.success) {
          const newGroups = new Set(subscribedGroups);
          newGroups.delete(groupId);
          set({ subscribedGroups: newGroups });
          console.log(`[Sync] Left group ${groupId}`);
        }
        resolve(response.success);
      });
    });
  },

  // Generic event listener creator
  onExpenseCreated: (callback: (data: any) => void) => {
    const { socket } = get();
    if (!socket) return () => {};

    socket.on('expense:created', callback);
    return () => socket.off('expense:created', callback);
  },

  onExpenseUpdated: (callback: (data: any) => void) => {
    const { socket } = get();
    if (!socket) return () => {};

    socket.on('expense:updated', callback);
    return () => socket.off('expense:updated', callback);
  },

  onExpenseDeleted: (callback: (data: any) => void) => {
    const { socket } = get();
    if (!socket) return () => {};

    socket.on('expense:deleted', callback);
    return () => socket.off('expense:deleted', callback);
  },

  onSettlementCreated: (callback: (data: any) => void) => {
    const { socket } = get();
    if (!socket) return () => {};

    socket.on('settlement:created', callback);
    return () => socket.off('settlement:created', callback);
  },

  onBalancesUpdated: (callback: (data: any) => void) => {
    const { socket } = get();
    if (!socket) return () => {};

    socket.on('balances:updated', callback);
    return () => socket.off('balances:updated', callback);
  },
}));
