import { create } from 'zustand';

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';
export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other';

export interface ExpenseSplit {
  userId: string;
  name: string;
  amount: number;
  shares?: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: {
    id: string;
    name: string;
  };
  splitType: SplitType;
  splits: ExpenseSplit[];
  date: string;
  notes?: string;
  photoUrl?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
}

interface ExpenseState {
  expenses: Record<string, Expense[]>; // Keyed by groupId
  currentExpense: Expense | null;
  isLoading: boolean;

  // Actions
  setExpenses: (groupId: string, expenses: Expense[]) => void;
  setCurrentExpense: (expense: Expense | null) => void;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<Expense>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string, groupId: string) => Promise<void>;
  fetchExpenses: (groupId: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: {},
  currentExpense: null,
  isLoading: false,

  setExpenses: (groupId, expenses) =>
    set((state) => ({
      expenses: { ...state.expenses, [groupId]: expenses },
    })),

  setCurrentExpense: (expense) => set({ currentExpense: expense }),

  createExpense: async (expenseData) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to create expense
      const newExpense: Expense = {
        ...expenseData,
        id: `expense_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      set((state) => ({
        expenses: {
          ...state.expenses,
          [expenseData.groupId]: [
            ...(state.expenses[expenseData.groupId] || []),
            newExpense,
          ],
        },
      }));

      return newExpense;
    } finally {
      set({ isLoading: false });
    }
  },

  updateExpense: async (expenseId, updates) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to update expense
      set((state) => {
        const newExpenses = { ...state.expenses };
        for (const groupId of Object.keys(newExpenses)) {
          newExpenses[groupId] = newExpenses[groupId].map((e) =>
            e.id === expenseId
              ? { ...e, ...updates, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
              : e
          );
        }
        return {
          expenses: newExpenses,
          currentExpense:
            state.currentExpense?.id === expenseId
              ? { ...state.currentExpense, ...updates, updatedAt: new Date().toISOString(), syncStatus: 'pending' }
              : state.currentExpense,
        };
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteExpense: async (expenseId, groupId) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to delete expense
      set((state) => ({
        expenses: {
          ...state.expenses,
          [groupId]: (state.expenses[groupId] || []).filter((e) => e.id !== expenseId),
        },
        currentExpense: state.currentExpense?.id === expenseId ? null : state.currentExpense,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExpenses: async (groupId) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to fetch expenses
      // For now, expenses are stored locally
    } finally {
      set({ isLoading: false });
    }
  },
}));
