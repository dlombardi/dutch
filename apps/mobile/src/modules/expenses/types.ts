/**
 * Expenses module types
 * Types shared across the expenses module
 */

export type SplitType = 'equal' | 'exact';

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInGroupCurrency: number;
  description: string;
  paidById: string;
  splitType: SplitType;
  splitParticipants: string[];
  splitAmounts: Record<string, number>;
  date: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  groupId: string;
  amount: number;
  description: string;
  paidById: string;
  createdById: string;
  currency?: string;
  date?: string;
  splitParticipants?: string[];
  splitType?: SplitType;
  splitAmounts?: Record<string, number>;
  exchangeRate?: number;
}

export interface UpdateExpenseInput {
  id: string;
  updates: {
    amount?: number;
    currency?: string;
    description?: string;
    paidById?: string;
    date?: string;
    splitType?: SplitType;
    splitParticipants?: string[];
    splitAmounts?: Record<string, number>;
  };
}

export interface ExpenseApiResponse {
  expense: Expense;
}

export interface ExpensesApiResponse {
  expenses: Expense[];
}
