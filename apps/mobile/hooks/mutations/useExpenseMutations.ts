import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import type { Expense } from '../../stores/expensesStore';

// Type for create expense input
interface CreateExpenseInput {
  groupId: string;
  amount: number;
  description: string;
  paidById: string;
  createdById: string;
  currency?: string;
  date?: string;
  splitParticipants?: string[];
  splitType?: 'equal' | 'exact';
  splitAmounts?: Record<string, number>;
  exchangeRate?: number;
}

// Type for update expense input
interface UpdateExpenseInput {
  id: string;
  updates: {
    amount?: number;
    currency?: string;
    description?: string;
    paidById?: string;
    date?: string;
    splitType?: 'equal' | 'exact';
    splitParticipants?: string[];
    splitAmounts?: Record<string, number>;
  };
}

/**
 * Mutation hook for creating an expense with optimistic updates.
 *
 * Features:
 * - Optimistic update: Immediately adds expense to cache
 * - Automatic rollback on error
 * - Invalidates related queries on success (balances, group expenses)
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const response = await api.createExpense(
        input.groupId,
        input.amount,
        input.description,
        input.paidById,
        input.createdById,
        input.currency,
        input.date,
        input.splitParticipants,
        input.splitType,
        input.splitAmounts,
        input.exchangeRate
      );
      return response.expense as Expense;
    },

    // Optimistic update
    onMutate: async (newExpense) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.expenses.byGroup(newExpense.groupId),
      });

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.byGroup(newExpense.groupId)
      );

      // Create an optimistic expense
      const optimisticExpense: Expense = {
        id: `temp-${Date.now()}`,
        groupId: newExpense.groupId,
        amount: newExpense.amount,
        currency: newExpense.currency || 'USD',
        exchangeRate: newExpense.exchangeRate || 1,
        amountInGroupCurrency: newExpense.amount * (newExpense.exchangeRate || 1),
        description: newExpense.description,
        paidById: newExpense.paidById,
        splitType: newExpense.splitType || 'equal',
        splitParticipants: newExpense.splitParticipants || [newExpense.paidById],
        splitAmounts: newExpense.splitAmounts || {},
        date: newExpense.date || new Date().toISOString(),
        createdById: newExpense.createdById,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.byGroup(newExpense.groupId),
        (old) => (old ? [...old, optimisticExpense] : [optimisticExpense])
      );

      // Return context with snapshot for rollback
      return { previousExpenses, optimisticId: optimisticExpense.id };
    },

    // On error, rollback to previous value
    onError: (err, newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          queryKeys.expenses.byGroup(newExpense.groupId),
          context.previousExpenses
        );
      }
    },

    // On success, replace optimistic expense with real one and invalidate related queries
    onSuccess: (expense, input, context) => {
      // Replace optimistic expense with real one
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.byGroup(input.groupId),
        (old) =>
          old?.map((e) => (e.id === context?.optimisticId ? expense : e)) || [expense]
      );

      // Invalidate balances since they've changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.balances(input.groupId),
      });
    },
  });
}

/**
 * Mutation hook for updating an expense with optimistic updates.
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateExpenseInput) => {
      const response = await api.updateExpense(id, updates);
      return response.expense as Expense;
    },

    onMutate: async ({ id, updates }) => {
      // Get the current expense to find its groupId
      const currentExpense = queryClient.getQueryData<Expense>(
        queryKeys.expenses.detail(id)
      );

      if (!currentExpense) return { previousExpense: undefined };

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.expenses.detail(id),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.expenses.byGroup(currentExpense.groupId),
      });

      // Snapshot previous values
      const previousExpense = currentExpense;
      const previousExpenses = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.byGroup(currentExpense.groupId)
      );

      // Create optimistically updated expense
      const optimisticExpense: Expense = {
        ...currentExpense,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update detail cache
      queryClient.setQueryData(queryKeys.expenses.detail(id), optimisticExpense);

      // Update list cache
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.byGroup(currentExpense.groupId),
        (old) => old?.map((e) => (e.id === id ? optimisticExpense : e))
      );

      return { previousExpense, previousExpenses, groupId: currentExpense.groupId };
    },

    onError: (err, { id }, context) => {
      if (context?.previousExpense) {
        queryClient.setQueryData(queryKeys.expenses.detail(id), context.previousExpense);
      }
      if (context?.previousExpenses && context?.groupId) {
        queryClient.setQueryData(
          queryKeys.expenses.byGroup(context.groupId),
          context.previousExpenses
        );
      }
    },

    onSuccess: (expense) => {
      // Update caches with real data
      queryClient.setQueryData(queryKeys.expenses.detail(expense.id), expense);
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.byGroup(expense.groupId),
        (old) => old?.map((e) => (e.id === expense.id ? expense : e))
      );

      // Invalidate balances
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.balances(expense.groupId),
      });
    },
  });
}

/**
 * Mutation hook for deleting an expense with optimistic updates.
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, groupId }: { id: string; groupId: string }) => {
      await api.deleteExpense(id);
      return { id, groupId };
    },

    onMutate: async ({ id, groupId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.expenses.byGroup(groupId),
      });

      // Snapshot previous value
      const previousExpenses = queryClient.getQueryData<Expense[]>(
        queryKeys.expenses.byGroup(groupId)
      );

      // Optimistically remove the expense
      queryClient.setQueryData<Expense[]>(
        queryKeys.expenses.byGroup(groupId),
        (old) => old?.filter((e) => e.id !== id)
      );

      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: queryKeys.expenses.detail(id),
      });

      return { previousExpenses };
    },

    onError: (err, { groupId }, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          queryKeys.expenses.byGroup(groupId),
          context.previousExpenses
        );
      }
    },

    onSuccess: (_, { groupId }) => {
      // Invalidate balances since they've changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.balances(groupId),
      });
    },
  });
}
