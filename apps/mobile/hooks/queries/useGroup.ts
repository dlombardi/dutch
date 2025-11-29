import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import type { Group, GroupMember, BalancesData } from '../../stores/groupsStore';
import { useAuthStore } from '../../stores/authStore';

/**
 * Query hook to fetch a single group by ID.
 *
 * Features:
 * - Automatic caching and background refetching
 * - Request deduplication (multiple components won't trigger multiple requests)
 * - Stale-while-revalidate pattern
 * - Waits for auth store hydration before making API calls
 */
export function useGroup(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.groups.detail(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await api.getGroup(groupId);
      return response.group as Group;
    },
    // Only fetch when we have a groupId AND auth is ready
    enabled: !!groupId && hasHydrated && isAuthenticated,
  });
}

/**
 * Query hook to fetch group members.
 */
export function useGroupMembers(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.groups.members(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await api.getGroupMembers(groupId);
      return response.members as GroupMember[];
    },
    enabled: !!groupId && hasHydrated && isAuthenticated,
  });
}

/**
 * Query hook to fetch group balances.
 */
export function useGroupBalances(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.groups.balances(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await api.getGroupBalances(groupId);
      return response as BalancesData;
    },
    enabled: !!groupId && hasHydrated && isAuthenticated,
  });
}

/**
 * Query hook to fetch a group by invite code (for join preview).
 */
export function useGroupByInviteCode(inviteCode: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.groups.byInviteCode(inviteCode ?? ''),
    queryFn: async () => {
      if (!inviteCode) throw new Error('Invite code is required');
      const response = await api.getGroupByInviteCode(inviteCode);
      return response.group as Group;
    },
    enabled: !!inviteCode && hasHydrated && isAuthenticated,
  });
}

/**
 * Composite hook that fetches all group data at once.
 * Useful for the group detail screen where we need group, members, and balances.
 *
 * Returns individual query states so the UI can render progressively
 * (show group name while balances are still loading).
 */
export function useGroupData(groupId: string | undefined) {
  const groupQuery = useGroup(groupId);
  const membersQuery = useGroupMembers(groupId);
  const balancesQuery = useGroupBalances(groupId);

  return {
    // Individual queries for granular access
    group: groupQuery.data,
    members: membersQuery.data ?? [],
    balances: balancesQuery.data,

    // Combined loading states
    isLoading: groupQuery.isLoading,
    isLoadingMembers: membersQuery.isLoading,
    isLoadingBalances: balancesQuery.isLoading,

    // Errors - only groupQuery error is "critical"
    error: groupQuery.error,
    membersError: membersQuery.error,
    balancesError: balancesQuery.error,

    // Refetch functions
    refetchGroup: groupQuery.refetch,
    refetchMembers: membersQuery.refetch,
    refetchBalances: balancesQuery.refetch,
    refetchAll: () => {
      groupQuery.refetch();
      membersQuery.refetch();
      balancesQuery.refetch();
    },
  };
}

/**
 * Hook to prefetch group data (useful when hovering over a group in a list).
 */
export function usePrefetchGroupData() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    // Prefetch all group-related queries
    queryClient.prefetchQuery({
      queryKey: queryKeys.groups.detail(groupId),
      queryFn: () => api.getGroup(groupId).then((r) => r.group),
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.groups.members(groupId),
      queryFn: () => api.getGroupMembers(groupId).then((r) => r.members),
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.groups.balances(groupId),
      queryFn: () => api.getGroupBalances(groupId),
    });
  };
}
