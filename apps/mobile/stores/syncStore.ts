import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Expense } from './expensesStore';
import type { Settlement } from './settlementsStore';
import type { BalancesData } from './groupsStore';

// Match the API configuration
const WS_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.evn.app';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// P2-004 fix: Typed event payloads for sync events
export interface ExpenseCreatedEvent {
  expense: Expense;
  groupId: string;
  createdBy: string;
}

export interface ExpenseUpdatedEvent {
  expense: Expense;
  groupId: string;
  updatedBy: string;
}

export interface ExpenseDeletedEvent {
  expenseId: string;
  groupId: string;
  deletedBy: string;
}

export interface SettlementCreatedEvent {
  settlement: Settlement;
  groupId: string;
  createdBy: string;
}

export interface BalancesUpdatedEvent {
  groupId: string;
  balances: BalancesData;
}

// Type for event callback functions
type SyncEventCallback<T> = (data: T) => void;

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

  // P2-004 fix: Typed event listeners
  onExpenseCreated: (callback: SyncEventCallback<ExpenseCreatedEvent>) => () => void;
  onExpenseUpdated: (callback: SyncEventCallback<ExpenseUpdatedEvent>) => () => void;
  onExpenseDeleted: (callback: SyncEventCallback<ExpenseDeletedEvent>) => () => void;
  onSettlementCreated: (callback: SyncEventCallback<SettlementCreatedEvent>) => () => void;
  onBalancesUpdated: (callback: SyncEventCallback<BalancesUpdatedEvent>) => () => void;
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
        newSocket.emit('joinGroup', { groupId }, (response: { success: boolean }) => {
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

  // P2-003 fix: Event listeners now fetch socket from current state
  // This prevents stale closure issues when socket reconnects
  onExpenseCreated: (callback: SyncEventCallback<ExpenseCreatedEvent>) => {
    const { socket } = get();
    if (!socket) return () => {};

    const handler = (data: ExpenseCreatedEvent) => callback(data);
    socket.on('expense:created', handler);

    // P2-003 fix: Return cleanup that gets current socket reference
    return () => {
      const currentSocket = get().socket;
      currentSocket?.off('expense:created', handler);
    };
  },

  onExpenseUpdated: (callback: SyncEventCallback<ExpenseUpdatedEvent>) => {
    const { socket } = get();
    if (!socket) return () => {};

    const handler = (data: ExpenseUpdatedEvent) => callback(data);
    socket.on('expense:updated', handler);

    return () => {
      const currentSocket = get().socket;
      currentSocket?.off('expense:updated', handler);
    };
  },

  onExpenseDeleted: (callback: SyncEventCallback<ExpenseDeletedEvent>) => {
    const { socket } = get();
    if (!socket) return () => {};

    const handler = (data: ExpenseDeletedEvent) => callback(data);
    socket.on('expense:deleted', handler);

    return () => {
      const currentSocket = get().socket;
      currentSocket?.off('expense:deleted', handler);
    };
  },

  onSettlementCreated: (callback: SyncEventCallback<SettlementCreatedEvent>) => {
    const { socket } = get();
    if (!socket) return () => {};

    const handler = (data: SettlementCreatedEvent) => callback(data);
    socket.on('settlement:created', handler);

    return () => {
      const currentSocket = get().socket;
      currentSocket?.off('settlement:created', handler);
    };
  },

  onBalancesUpdated: (callback: SyncEventCallback<BalancesUpdatedEvent>) => {
    const { socket } = get();
    if (!socket) return () => {};

    const handler = (data: BalancesUpdatedEvent) => callback(data);
    socket.on('balances:updated', handler);

    return () => {
      const currentSocket = get().socket;
      currentSocket?.off('balances:updated', handler);
    };
  },
}));
