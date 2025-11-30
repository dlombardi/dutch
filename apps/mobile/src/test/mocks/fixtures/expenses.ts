import type { Expense } from '@/modules/expenses/types';

export const mockExpense: Expense = {
  id: 'expense-1',
  groupId: 'group-1',
  amount: 85.5,
  currency: 'USD',
  exchangeRate: 1,
  amountInGroupCurrency: 85.5,
  description: 'Dinner at Olive Garden',
  paidById: 'user-1',
  splitType: 'equal',
  splitParticipants: ['user-1', 'user-2'],
  splitAmounts: {},
  date: '2025-11-28T19:00:00Z',
  createdById: 'user-1',
  createdAt: '2025-11-28T12:00:00Z',
  updatedAt: '2025-11-28T12:00:00Z',
};

export const mockExpenseSettled: Expense = {
  id: 'expense-2',
  groupId: 'group-1',
  amount: 45.0,
  currency: 'USD',
  exchangeRate: 1,
  amountInGroupCurrency: 45.0,
  description: 'Uber to airport',
  paidById: 'user-2',
  splitType: 'equal',
  splitParticipants: ['user-1', 'user-2'],
  splitAmounts: {},
  date: '2025-11-27T10:00:00Z',
  createdById: 'user-2',
  createdAt: '2025-11-27T10:00:00Z',
  updatedAt: '2025-11-27T10:00:00Z',
};

export const mockExpenseExact: Expense = {
  id: 'expense-3',
  groupId: 'group-1',
  amount: 120.0,
  currency: 'EUR',
  exchangeRate: 1.08,
  amountInGroupCurrency: 129.6,
  description: 'Groceries',
  paidById: 'user-1',
  splitType: 'exact',
  splitParticipants: ['user-1', 'user-2', 'user-3'],
  splitAmounts: { 'user-1': 60, 'user-2': 40, 'user-3': 20 },
  date: '2025-11-20T08:00:00Z',
  createdById: 'user-1',
  createdAt: '2025-11-20T08:00:00Z',
  updatedAt: '2025-11-20T08:00:00Z',
};

export const mockExpenses: Expense[] = [
  mockExpense,
  mockExpenseSettled,
  mockExpenseExact,
];
