/**
 * useExpenses hooks
 * React Query hooks for fetching expense data
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/modules/auth";
import { validateExpense, validateExpenses } from "@/lib/utils/validators";
import { expenseService } from "../services";

/**
 * Query hook to fetch expenses for a specific group.
 *
 * Features:
 * - Automatic caching and background refetching
 * - Request deduplication (multiple components won't trigger multiple requests)
 * - Stale-while-revalidate pattern
 * - Waits for auth store hydration before making API calls
 */
export function useGroupExpenses(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.expenses.byGroup(groupId ?? ""),
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await expenseService.getGroupExpenses(groupId);
      return validateExpenses(response.expenses);
    },
    enabled: !!groupId && hasHydrated && isAuthenticated,
  });
}

/**
 * Query hook to fetch a single expense by ID.
 */
export function useExpense(expenseId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId ?? ""),
    queryFn: async () => {
      if (!expenseId) throw new Error("Expense ID is required");
      const response = await expenseService.getExpense(expenseId);
      return validateExpense(response.expense);
    },
    enabled: !!expenseId && hasHydrated && isAuthenticated,
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
      queryFn: () =>
        expenseService
          .getGroupExpenses(groupId)
          .then((r) => validateExpenses(r.expenses)),
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
      queryFn: () =>
        expenseService
          .getExpense(expenseId)
          .then((r) => validateExpense(r.expense)),
    });
  };
}
