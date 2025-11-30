import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Expense } from '@/modules/expenses';
import type { Settlement } from '@/modules/settlements';
import type { BalancesData } from '@/modules/groups';
import { logger } from '@/lib/utils/logger';

// Match the API configuration
const WS_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.evn.app';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

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

  // Event listeners
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
      logger.debug('Connected to sync server', { category: 'sync' });
      set({ connectionStatus: 'connected' });
    });

    newSocket.on('welcome', (data: { message: string; socketId: string }) => {
      logger.debug('Welcome from server', { category: 'sync', message: data.message });
      set({ socketId: data.socketId });
    });

    newSocket.on('disconnect', (reason) => {
      logger.debug('Disconnected from server', { category: 'sync', reason });
      set({ connectionStatus: 'disconnected', socketId: null });
    });

    newSocket.on('connect_error', (error) => {
      logger.warn('Connection error', { category: 'sync', error: error.message });
      set({ lastError: error.message, connectionStatus: 'disconnected' });
    });

    newSocket.io.on('reconnect_attempt', () => {
      logger.debug('Attempting to reconnect...', { category: 'sync' });
      set({ connectionStatus: 'reconnecting' });
    });

    newSocket.io.on('reconnect', () => {
      logger.info('Reconnected to server', { category: 'sync' });
      set({ connectionStatus: 'connected' });

      const { subscribedGroups } = get();
      subscribedGroups.forEach((groupId) => {
        newSocket.emit('joinGroup', { groupId }, (response: { success: boolean }) => {
          logger.debug('Rejoined group', { category: 'sync', groupId, success: response.success });
        });
      });
    });

    newSocket.io.on('reconnect_failed', () => {
      logger.warn('Reconnection failed', { category: 'sync' });
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
      logger.warn('Cannot join group - not connected', { category: 'sync', groupId });
      return false;
    }

    return new Promise((resolve) => {
      socket.emit('joinGroup', { groupId }, (response: { success: boolean; groupId: string }) => {
        if (response.success) {
          const newGroups = new Set(subscribedGroups);
          newGroups.add(groupId);
          set({ subscribedGroups: newGroups });
          logger.debug('Joined group', { category: 'sync', groupId });
        }
        resolve(response.success);
      });
    });
  },

  leaveGroup: async (groupId: string): Promise<boolean> => {
    const { socket, subscribedGroups } = get();

    if (!socket?.connected) {
      logger.warn('Cannot leave group - not connected', { category: 'sync', groupId });
      return false;
    }

    return new Promise((resolve) => {
      socket.emit('leaveGroup', { groupId }, (response: { success: boolean; groupId: string }) => {
        if (response.success) {
          const newGroups = new Set(subscribedGroups);
          newGroups.delete(groupId);
          set({ subscribedGroups: newGroups });
          logger.debug('Left group', { category: 'sync', groupId });
        }
        resolve(response.success);
      });
    });
  },

  onExpenseCreated: (callback: SyncEventCallback<ExpenseCreatedEvent>) => {
    const { socket } = get();
    if (!socket) return () => {};

    const handler = (data: ExpenseCreatedEvent) => callback(data);
    socket.on('expense:created', handler);

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
