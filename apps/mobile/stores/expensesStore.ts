/**
 * Expense types for use throughout the app.
 *
 * NOTE: This store has been simplified. All expense data fetching, caching,
 * and mutations are now handled by React Query (see hooks/queries/useExpenses.ts
 * and hooks/mutations/useExpenseMutations.ts).
 *
 * Offline queue functionality is handled by offlineQueueStore.ts.
 */

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
