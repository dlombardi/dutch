/**
 * useSettlements hooks
 * React Query hooks for fetching settlement data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/modules/auth';
import { settlementService } from '../services';
import type { Settlement } from '../types';

/**
 * Query hook to fetch settlements for a specific group.
 */
export function useGroupSettlements(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.settlements.byGroup(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await settlementService.getGroupSettlements(groupId);
      return response.settlements as Settlement[];
    },
    enabled: !!groupId && hasHydrated && isAuthenticated,
  });
}

/**
 * Hook to prefetch settlements for a group.
 */
export function usePrefetchGroupSettlements() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.settlements.byGroup(groupId),
      queryFn: () =>
        settlementService.getGroupSettlements(groupId).then((r) => r.settlements),
    });
  };
}
