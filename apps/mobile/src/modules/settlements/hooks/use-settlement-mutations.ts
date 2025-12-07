/**
 * useSettlementMutations hooks
 * React Query mutation hooks for settlement operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { settlementService } from "../services";
import type { CreateSettlementInput, Settlement } from "../types";

/**
 * Mutation hook for creating a settlement with optimistic updates.
 *
 * Features:
 * - Optimistic update: Immediately adds settlement to cache
 * - Automatic rollback on error
 * - Invalidates related queries on success (balances)
 */
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSettlementInput) => {
      const response = await settlementService.createSettlement(input);
      return response.settlement as Settlement;
    },

    // Optimistic update
    onMutate: async (newSettlement) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.settlements.byGroup(newSettlement.groupId),
      });

      // Snapshot the previous value
      const previousSettlements = queryClient.getQueryData<Settlement[]>(
        queryKeys.settlements.byGroup(newSettlement.groupId),
      );

      // Create an optimistic settlement
      const optimisticSettlement: Settlement = {
        id: `temp-${Date.now()}`,
        groupId: newSettlement.groupId,
        fromUserId: newSettlement.fromUserId,
        toUserId: newSettlement.toUserId,
        amount: newSettlement.amount,
        currency: newSettlement.currency || "USD",
        method: newSettlement.method || "cash",
        createdById: newSettlement.createdById,
        createdAt: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData<Settlement[]>(
        queryKeys.settlements.byGroup(newSettlement.groupId),
        (old) =>
          old ? [...old, optimisticSettlement] : [optimisticSettlement],
      );

      // Return context with snapshot for rollback
      return { previousSettlements, optimisticId: optimisticSettlement.id };
    },

    // On error, rollback to previous value
    onError: (err, newSettlement, context) => {
      if (context?.previousSettlements) {
        queryClient.setQueryData(
          queryKeys.settlements.byGroup(newSettlement.groupId),
          context.previousSettlements,
        );
      }
    },

    // On success, replace optimistic settlement with real one
    onSuccess: (settlement, input, context) => {
      // Replace optimistic settlement with real one
      queryClient.setQueryData<Settlement[]>(
        queryKeys.settlements.byGroup(input.groupId),
        (old) =>
          old?.map((s) =>
            s.id === context?.optimisticId ? settlement : s,
          ) || [settlement],
      );

      // Invalidate balances since they've changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.balances(input.groupId),
      });
    },
  });
}
