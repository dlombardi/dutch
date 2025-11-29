import { create } from 'zustand';
import { api } from '../lib/api';

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  method: string;
  createdById: string;
  createdAt: string;
}

interface SettlementsState {
  settlements: Settlement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createSettlement: (
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    createdById: string,
    currency?: string,
    method?: string
  ) => Promise<Settlement | null>;
  fetchGroupSettlements: (groupId: string) => Promise<Settlement[] | null>;
  clearError: () => void;
}

export const useSettlementsStore = create<SettlementsState>()((set) => ({
  settlements: [],
  isLoading: false,
  error: null,

  createSettlement: async (
    groupId,
    fromUserId,
    toUserId,
    amount,
    createdById,
    currency,
    method
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createSettlement(
        groupId,
        fromUserId,
        toUserId,
        amount,
        createdById,
        currency,
        method
      );
      const newSettlement = response.settlement;
      set((state) => ({
        settlements: [...state.settlements, newSettlement],
      }));
      return newSettlement;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create settlement';
      set({ error: errorMessage });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGroupSettlements: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getGroupSettlements(groupId);
      set({ settlements: response.settlements });
      return response.settlements;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch settlements';
      set({ error: errorMessage });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
