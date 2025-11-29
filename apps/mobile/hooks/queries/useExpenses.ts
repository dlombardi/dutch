import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import type { Expense } from '../../stores/expensesStore';

/**
 * Query hook to fetch expenses for a specific group.
 *
 * Features:
 * - Automatic caching and background refetching
 * - Request deduplication (multiple components won't trigger multiple requests)
 * - Stale-while-revalidate pattern
 */
export function useGroupExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.byGroup(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await api.getGroupExpenses(groupId);
      return response.expenses as Expense[];
    },
    enabled: !!groupId,
  });
}

/**
 * Query hook to fetch a single expense by ID.
 */
export function useExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId ?? ''),
    queryFn: async () => {
      if (!expenseId) throw new Error('Expense ID is required');
      const response = await api.getExpense(expenseId);
      return response.expense as Expense;
    },
    enabled: !!expenseId,
  });
}

/**
 * Hook to prefetch expenses for a group.
 * Useful when navigating to a group detail view.
 */
export function usePrefetchGroupExpenses() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.expenses.byGroup(groupId),
      queryFn: () => api.getGroupExpenses(groupId).then((r) => r.expenses),
    });
  };
}

/**
 * Hook to prefetch a single expense.
 * Useful when hovering over an expense in a list.
 */
export function usePrefetchExpense() {
  const queryClient = useQueryClient();

  return (expenseId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.expenses.detail(expenseId),
      queryFn: () => api.getExpense(expenseId).then((r) => r.expense),
    });
  };
}
