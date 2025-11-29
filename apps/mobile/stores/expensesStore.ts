import { create } from 'zustand';
import { api } from '../lib/api';

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  description: string;
  paidById: string;
  splitType: string;
  date: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpensesState {
  expenses: Expense[];
  currentExpense: Expense | null;
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
    date?: string
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
  fetchExpense: (id: string) => Promise<Expense | null>;
  fetchGroupExpenses: (groupId: string) => Promise<Expense[] | null>;
  setCurrentExpense: (expense: Expense | null) => void;
  clearError: () => void;
  clearExpenses: () => void;
}

export const useExpensesStore = create<ExpensesState>()((set) => ({
  expenses: [],
  currentExpense: null,
  isLoading: false,
  error: null,

  createExpense: async (
    groupId,
    amount,
    description,
    paidById,
    createdById,
    currency,
    date
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createExpense(
        groupId,
        amount,
        description,
        paidById,
        createdById,
        currency,
        date
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
}));
