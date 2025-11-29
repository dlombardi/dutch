import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { useNetworkStore } from './networkStore';

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInGroupCurrency: number;
  description: string;
  paidById: string;
  splitType: string;
  splitParticipants: string[];
  splitAmounts: Record<string, number>;
  date: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Pending expense with local ID for offline queue
export interface PendingExpense {
  localId: string;
  groupId: string;
  amount: number;
  currency?: string;
  description: string;
  paidById: string;
  createdById: string;
  date?: string;
  splitParticipants?: string[];
  exchangeRate?: number;
  createdAt: string;
  isSyncing?: boolean;
}

interface ExpensesState {
  expenses: Expense[];
  pendingExpenses: PendingExpense[];
  currentExpense: Expense | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  createExpense: (
    groupId: string,
    amount: number,
    description: string,
    paidById: string,
    createdById: string,
    currency?: string,
    date?: string,
    splitParticipants?: string[],
    exchangeRate?: number
  ) => Promise<Expense | null>;
  updateExpense: (
    id: string,
    updates: {
      amount?: number;
      currency?: string;
      description?: string;
      paidById?: string;
      date?: string;
    }
  ) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  fetchExpense: (id: string) => Promise<Expense | null>;
  fetchGroupExpenses: (groupId: string) => Promise<Expense[] | null>;
  setCurrentExpense: (expense: Expense | null) => void;
  clearError: () => void;
  clearExpenses: () => void;

  // Offline queue actions
  syncPendingExpenses: () => Promise<void>;
  removePendingExpense: (localId: string) => void;

  // Real-time sync handlers
  handleExpenseCreated: (expense: Expense) => void;
  handleExpenseUpdated: (expense: Expense) => void;
  handleExpenseDeleted: (expenseId: string) => void;
}

// Generate a unique local ID for pending expenses
function generateLocalId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      pendingExpenses: [],
      currentExpense: null,
      isLoading: false,
      isSyncing: false,
      error: null,

      createExpense: async (
        groupId,
        amount,
        description,
        paidById,
        createdById,
        currency,
        date,
        splitParticipants,
        exchangeRate
      ) => {
        const { isConnected, isInternetReachable } = useNetworkStore.getState();
        const isOffline = !isConnected || isInternetReachable === false;

        // If offline, queue the expense locally
        if (isOffline) {
          const pendingExpense: PendingExpense = {
            localId: generateLocalId(),
            groupId,
            amount,
            currency,
            description,
            paidById,
            createdById,
            date,
            splitParticipants,
            exchangeRate,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            pendingExpenses: [...state.pendingExpenses, pendingExpense],
          }));

          // Return a mock expense object so the UI can show it
          return {
            id: pendingExpense.localId,
            groupId,
            amount,
            currency: currency || 'USD',
            exchangeRate: exchangeRate || 1,
            amountInGroupCurrency: amount * (exchangeRate || 1),
            description,
            paidById,
            splitType: 'equal',
            splitParticipants: splitParticipants || [paidById],
            splitAmounts: {},
            date: date || new Date().toISOString(),
            createdById,
            createdAt: pendingExpense.createdAt,
            updatedAt: pendingExpense.createdAt,
          } as Expense;
        }

        // Online: create expense normally
        set({ isLoading: true, error: null });
        try {
          const response = await api.createExpense(
            groupId,
            amount,
            description,
            paidById,
            createdById,
            currency,
            date,
            splitParticipants,
            undefined, // splitType
            undefined, // splitAmounts
            exchangeRate
          );
          const newExpense = response.expense;
          set((state) => ({
            expenses: [...state.expenses, newExpense],
          }));
          return newExpense;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create expense';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateExpense: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.updateExpense(id, updates);
          const updatedExpense = response.expense;
          set((state) => ({
            expenses: state.expenses.map((e) =>
              e.id === id ? updatedExpense : e
            ),
            currentExpense:
              state.currentExpense?.id === id
                ? updatedExpense
                : state.currentExpense,
          }));
          return updatedExpense;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update expense';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await api.deleteExpense(id);
          set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id),
            currentExpense:
              state.currentExpense?.id === id ? null : state.currentExpense,
          }));
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to delete expense';
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.getExpense(id);
          const expense = response.expense;
          set({ currentExpense: expense });
          return expense;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch expense';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchGroupExpenses: async (groupId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.getGroupExpenses(groupId);
          const expenses = response.expenses;
          set({ expenses });
          return expenses;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch expenses';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentExpense: (expense) => {
        set({ currentExpense: expense });
      },

      clearError: () => {
        set({ error: null });
      },

      clearExpenses: () => {
        set({ expenses: [], currentExpense: null });
      },

      // Sync pending expenses when coming online
      syncPendingExpenses: async () => {
        const { pendingExpenses } = get();
        if (pendingExpenses.length === 0) return;

        set({ isSyncing: true });

        for (const pending of pendingExpenses) {
          // Mark as syncing
          set((state) => ({
            pendingExpenses: state.pendingExpenses.map((p) =>
              p.localId === pending.localId ? { ...p, isSyncing: true } : p
            ),
          }));

          try {
            const response = await api.createExpense(
              pending.groupId,
              pending.amount,
              pending.description,
              pending.paidById,
              pending.createdById,
              pending.currency,
              pending.date,
              pending.splitParticipants,
              undefined, // splitType
              undefined, // splitAmounts
              pending.exchangeRate
            );

            const newExpense = response.expense;

            // Remove from pending and add to expenses
            set((state) => ({
              pendingExpenses: state.pendingExpenses.filter(
                (p) => p.localId !== pending.localId
              ),
              expenses: [...state.expenses, newExpense],
            }));
          } catch (error) {
            // Mark as not syncing on error, will retry next time
            set((state) => ({
              pendingExpenses: state.pendingExpenses.map((p) =>
                p.localId === pending.localId ? { ...p, isSyncing: false } : p
              ),
            }));
            console.error('[Expenses] Failed to sync pending expense:', error);
          }
        }

        set({ isSyncing: false });
      },

      removePendingExpense: (localId) => {
        set((state) => ({
          pendingExpenses: state.pendingExpenses.filter(
            (p) => p.localId !== localId
          ),
        }));
      },

      // Real-time sync handlers
      handleExpenseCreated: (expense) => {
        set((state) => {
          // Check if expense already exists (avoid duplicates from own actions)
          if (state.expenses.some((e) => e.id === expense.id)) {
            return state;
          }
          return { expenses: [...state.expenses, expense] };
        });
      },

      handleExpenseUpdated: (expense) => {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
          currentExpense:
            state.currentExpense?.id === expense.id ? expense : state.currentExpense,
        }));
      },

      handleExpenseDeleted: (expenseId) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== expenseId),
          currentExpense:
            state.currentExpense?.id === expenseId ? null : state.currentExpense,
        }));
      },
    }),
    {
      name: 'expenses-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        expenses: state.expenses,
        pendingExpenses: state.pendingExpenses,
      }),
    }
  )
);
