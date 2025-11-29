import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import type { Settlement } from '../../stores/settlementsStore';

/**
 * Query hook to fetch settlements for a specific group.
 *
 * Features:
 * - Automatic caching and background refetching
 * - Request deduplication (multiple components won't trigger multiple requests)
 * - Stale-while-revalidate pattern
 */
export function useGroupSettlements(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.settlements.byGroup(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await api.getGroupSettlements(groupId);
      return response.settlements as Settlement[];
    },
    enabled: !!groupId,
  });
}

/**
 * Hook to prefetch settlements for a group.
 * Useful when navigating to a group detail view.
 */
export function usePrefetchGroupSettlements() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.settlements.byGroup(groupId),
      queryFn: () => api.getGroupSettlements(groupId).then((r) => r.settlements),
    });
  };
}
