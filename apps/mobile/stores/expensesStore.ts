import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';
import { isOffline } from './networkStore'; // P2-002 fix: use function instead of store import

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
  // Retry tracking
  retryCount?: number;
  lastRetryAt?: string;
  errorMessage?: string;
}

// Maximum retry attempts before giving up
const MAX_RETRY_COUNT = 3;

// Calculate exponential backoff delay in milliseconds
// 1st retry: 1s, 2nd: 4s, 3rd: 16s
function getRetryDelay(retryCount: number): number {
  return Math.pow(4, retryCount) * 1000;
}

// Check if enough time has passed for a retry
function canRetry(pending: PendingExpense): boolean {
  const retryCount = pending.retryCount ?? 0;
  if (retryCount >= MAX_RETRY_COUNT) return false;

  if (!pending.lastRetryAt) return true;

  const lastRetry = new Date(pending.lastRetryAt).getTime();
  const now = Date.now();
  const delay = getRetryDelay(retryCount);

  return now - lastRetry >= delay;
}

// Operation types for granular state tracking (P0 fix)
export type ExpenseOperation =
  | 'createExpense'
  | 'updateExpense'
  | 'deleteExpense'
  | 'fetchExpense'
  | 'fetchGroupExpenses';

// Loading states per operation
export interface ExpenseLoadingStates {
  createExpense: boolean;
  updateExpense: boolean;
  deleteExpense: boolean;
  fetchExpense: boolean;
  fetchGroupExpenses: boolean;
}

// Error states per operation
export interface ExpenseErrorStates {
  createExpense: string | null;
  updateExpense: string | null;
  deleteExpense: string | null;
  fetchExpense: string | null;
  fetchGroupExpenses: string | null;
}

interface ExpensesState {
  expenses: Expense[];
  pendingExpenses: PendingExpense[];
  currentExpense: Expense | null;
  isSyncing: boolean;

  // Granular loading and error states (P0 fix)
  loadingStates: ExpenseLoadingStates;
  errors: ExpenseErrorStates;

  // Legacy compatibility - computed from granular states
  isLoading: boolean;
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
  clearExpenses: () => void;

  // Granular error/loading management (P0 fix)
  clearError: (operation?: ExpenseOperation) => void;
  clearAllErrors: () => void;
  isOperationLoading: (operation: ExpenseOperation) => boolean;
  getOperationError: (operation: ExpenseOperation) => string | null;

  // Offline queue actions
  syncPendingExpenses: () => Promise<void>;
  removePendingExpense: (localId: string) => void;
  getFailedPendingExpenses: () => PendingExpense[];

  // Real-time sync handlers
  handleExpenseCreated: (expense: Expense) => void;
  handleExpenseUpdated: (expense: Expense) => void;
  handleExpenseDeleted: (expenseId: string) => void;
}

// Generate a unique local ID for pending expenses
function generateLocalId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to get initial loading states
const initialLoadingStates: ExpenseLoadingStates = {
  createExpense: false,
  updateExpense: false,
  deleteExpense: false,
  fetchExpense: false,
  fetchGroupExpenses: false,
};

// Helper to get initial error states
const initialErrorStates: ExpenseErrorStates = {
  createExpense: null,
  updateExpense: null,
  deleteExpense: null,
  fetchExpense: null,
  fetchGroupExpenses: null,
};

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      pendingExpenses: [],
      currentExpense: null,
      isSyncing: false,
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
        // P2-002 fix: use isOffline() function instead of direct store access
        // If offline, queue the expense locally
        if (isOffline()) {
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
        set((state) => ({
          loadingStates: { ...state.loadingStates, createExpense: true },
          errors: { ...state.errors, createExpense: null },
        }));
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
            loadingStates: { ...state.loadingStates, createExpense: false },
          }));
          return newExpense;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create expense';
          set((state) => ({
            errors: { ...state.errors, createExpense: errorMessage },
            loadingStates: { ...state.loadingStates, createExpense: false },
          }));
          return null;
        }
      },

      updateExpense: async (id, updates) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, updateExpense: true },
          errors: { ...state.errors, updateExpense: null },
        }));
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
            loadingStates: { ...state.loadingStates, updateExpense: false },
          }));
          return updatedExpense;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update expense';
          set((state) => ({
            errors: { ...state.errors, updateExpense: errorMessage },
            loadingStates: { ...state.loadingStates, updateExpense: false },
          }));
          return null;
        }
      },

      deleteExpense: async (id) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, deleteExpense: true },
          errors: { ...state.errors, deleteExpense: null },
        }));
        try {
          await api.deleteExpense(id);
          set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id),
            currentExpense:
              state.currentExpense?.id === id ? null : state.currentExpense,
            loadingStates: { ...state.loadingStates, deleteExpense: false },
          }));
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to delete expense';
          set((state) => ({
            errors: { ...state.errors, deleteExpense: errorMessage },
            loadingStates: { ...state.loadingStates, deleteExpense: false },
          }));
          return false;
        }
      },

      fetchExpense: async (id) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchExpense: true },
          errors: { ...state.errors, fetchExpense: null },
        }));
        try {
          const response = await api.getExpense(id);
          const expense = response.expense;
          set((state) => ({
            currentExpense: expense,
            loadingStates: { ...state.loadingStates, fetchExpense: false },
          }));
          return expense;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch expense';
          set((state) => ({
            errors: { ...state.errors, fetchExpense: errorMessage },
            loadingStates: { ...state.loadingStates, fetchExpense: false },
          }));
          return null;
        }
      },

      fetchGroupExpenses: async (groupId) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchGroupExpenses: true },
          errors: { ...state.errors, fetchGroupExpenses: null },
        }));
        try {
          const response = await api.getGroupExpenses(groupId);
          const expenses = response.expenses;
          set((state) => ({
            expenses,
            loadingStates: { ...state.loadingStates, fetchGroupExpenses: false },
          }));
          return expenses;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch expenses';
          set((state) => ({
            errors: { ...state.errors, fetchGroupExpenses: errorMessage },
            loadingStates: { ...state.loadingStates, fetchGroupExpenses: false },
          }));
          return null;
        }
      },

      setCurrentExpense: (expense) => {
        set({ currentExpense: expense });
      },

      clearExpenses: () => {
        set({ expenses: [], currentExpense: null });
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

      // Sync pending expenses when coming online
      syncPendingExpenses: async () => {
        const { pendingExpenses } = get();
        if (pendingExpenses.length === 0) return;

        // Filter to expenses that can be retried
        const retryablePending = pendingExpenses.filter(canRetry);
        if (retryablePending.length === 0) return;

        set({ isSyncing: true });

        for (const pending of retryablePending) {
          // Skip if already syncing
          if (pending.isSyncing) continue;

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
            const currentRetryCount = pending.retryCount ?? 0;
            const newRetryCount = currentRetryCount + 1;
            const errorMessage = error instanceof Error ? error.message : 'Sync failed';

            // Update with retry info
            set((state) => ({
              pendingExpenses: state.pendingExpenses.map((p) =>
                p.localId === pending.localId
                  ? {
                      ...p,
                      isSyncing: false,
                      retryCount: newRetryCount,
                      lastRetryAt: new Date().toISOString(),
                      errorMessage: newRetryCount >= MAX_RETRY_COUNT
                        ? `Failed after ${MAX_RETRY_COUNT} attempts: ${errorMessage}`
                        : errorMessage,
                    }
                  : p
              ),
            }));

            if (newRetryCount >= MAX_RETRY_COUNT) {
              console.warn(
                `[Expenses] Pending expense ${pending.localId} failed after ${MAX_RETRY_COUNT} retries`
              );
            }
          }
        }

        set({ isSyncing: false });
      },

      // Get pending expenses that have permanently failed
      getFailedPendingExpenses: () => {
        return get().pendingExpenses.filter(
          (p) => (p.retryCount ?? 0) >= MAX_RETRY_COUNT
        );
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

// Selector hooks for convenience
export const useExpensesLoading = () =>
  useExpensesStore((state) => state.loadingStates);
export const useExpensesErrors = () => useExpensesStore((state) => state.errors);
export const useIsAnyExpenseOperationLoading = () =>
  useExpensesStore((state) => Object.values(state.loadingStates).some(Boolean));
