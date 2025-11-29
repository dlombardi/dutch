import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Operation types for granular state tracking (P0 fix)
export type SettlementOperation =
  | 'createSettlement'
  | 'fetchGroupSettlements';

// Loading states per operation
export interface SettlementLoadingStates {
  createSettlement: boolean;
  fetchGroupSettlements: boolean;
}

// Error states per operation
export interface SettlementErrorStates {
  createSettlement: string | null;
  fetchGroupSettlements: string | null;
}

interface SettlementsState {
  settlements: Settlement[];

  // Granular loading and error states (P0 fix)
  loadingStates: SettlementLoadingStates;
  errors: SettlementErrorStates;

  // Legacy compatibility - computed from granular states
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

  // Granular error/loading management (P0 fix)
  clearError: (operation?: SettlementOperation) => void;
  clearAllErrors: () => void;
  isOperationLoading: (operation: SettlementOperation) => boolean;
  getOperationError: (operation: SettlementOperation) => string | null;

  // Real-time sync handlers
  handleSettlementCreated: (settlement: Settlement) => void;
}

// Helper to get initial loading states
const initialLoadingStates: SettlementLoadingStates = {
  createSettlement: false,
  fetchGroupSettlements: false,
};

// Helper to get initial error states
const initialErrorStates: SettlementErrorStates = {
  createSettlement: null,
  fetchGroupSettlements: null,
};

export const useSettlementsStore = create<SettlementsState>()(
  persist(
    (set, get) => ({
      settlements: [],
      loadingStates: { ...initialLoadingStates },
      errors: { ...initialErrorStates },

      // Computed legacy compatibility getters
      get isLoading() {
        const state = get();
        return Object.values(state.loadingStates).some(Boolean);
      },
      get error() {
        const state = get();
        return Object.values(state.errors).find((e) => e !== null) ?? null;
      },

      createSettlement: async (
        groupId,
        fromUserId,
        toUserId,
        amount,
        createdById,
        currency,
        method
      ) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, createSettlement: true },
          errors: { ...state.errors, createSettlement: null },
        }));
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
            loadingStates: { ...state.loadingStates, createSettlement: false },
          }));
          return newSettlement;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create settlement';
          set((state) => ({
            errors: { ...state.errors, createSettlement: errorMessage },
            loadingStates: { ...state.loadingStates, createSettlement: false },
          }));
          return null;
        }
      },

      fetchGroupSettlements: async (groupId) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchGroupSettlements: true },
          errors: { ...state.errors, fetchGroupSettlements: null },
        }));
        try {
          const response = await api.getGroupSettlements(groupId);
          set((state) => ({
            settlements: response.settlements,
            loadingStates: { ...state.loadingStates, fetchGroupSettlements: false },
          }));
          return response.settlements;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch settlements';
          set((state) => ({
            errors: { ...state.errors, fetchGroupSettlements: errorMessage },
            loadingStates: { ...state.loadingStates, fetchGroupSettlements: false },
          }));
          return null;
        }
      },

      // Clear a specific operation's error, or all errors if no operation specified
      clearError: (operation) => {
        if (operation) {
          set((state) => ({
            errors: { ...state.errors, [operation]: null },
          }));
        } else {
          // Legacy behavior: clear all errors
          set({ errors: { ...initialErrorStates } });
        }
      },

      clearAllErrors: () => {
        set({ errors: { ...initialErrorStates } });
      },

      // Helper to check if a specific operation is loading
      isOperationLoading: (operation) => {
        return get().loadingStates[operation];
      },

      // Helper to get error for a specific operation
      getOperationError: (operation) => {
        return get().errors[operation];
      },

      // Real-time sync handlers
      handleSettlementCreated: (settlement) => {
        set((state) => {
          // Check if settlement already exists (avoid duplicates from own actions)
          if (state.settlements.some((s) => s.id === settlement.id)) {
            return state;
          }
          return { settlements: [...state.settlements, settlement] };
        });
      },
    }),
    {
      name: 'settlements-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settlements: state.settlements,
      }),
    }
  )
);

// Selector hooks for convenience
export const useSettlementsLoading = () =>
  useSettlementsStore((state) => state.loadingStates);
export const useSettlementsErrors = () =>
  useSettlementsStore((state) => state.errors);
export const useIsAnySettlementOperationLoading = () =>
  useSettlementsStore((state) => Object.values(state.loadingStates).some(Boolean));
