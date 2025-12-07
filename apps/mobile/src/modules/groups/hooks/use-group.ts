/**
 * useGroup hooks
 * React Query hooks for fetching group data
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/modules/auth";
import {
  validateBalancesData,
  validateGroup,
  validateGroupMembers,
} from "@/lib/utils/validators";
import { groupService } from "../services";

/**
 * Query hook to fetch a single group by ID.
 */
export function useGroup(groupId: string | undefined) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  return useQuery({
    queryKey: queryKeys.groups.detail(groupId ?? ""),
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await groupService.getGroup(groupId);
      return validateGroup(response.group);
    },
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
    queryKey: queryKeys.groups.members(groupId ?? ""),
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await groupService.getGroupMembers(groupId);
      return validateGroupMembers(response.members);
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
    queryKey: queryKeys.groups.balances(groupId ?? ""),
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const response = await groupService.getGroupBalances(groupId);
      return validateBalancesData(response);
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
    queryKey: queryKeys.groups.byInviteCode(inviteCode ?? ""),
    queryFn: async () => {
      if (!inviteCode) throw new Error("Invite code is required");
      const response = await groupService.getGroupByInviteCode(inviteCode);
      return validateGroup(response.group);
    },
    enabled: !!inviteCode && hasHydrated && isAuthenticated,
  });
}

/**
 * Composite hook that fetches all group data at once.
 * Useful for the group detail screen.
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

    // Errors
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
 * Hook to prefetch group data.
 */
export function usePrefetchGroupData() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.groups.detail(groupId),
      queryFn: () =>
        groupService.getGroup(groupId).then((r) => validateGroup(r.group)),
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.groups.members(groupId),
      queryFn: () =>
        groupService
          .getGroupMembers(groupId)
          .then((r) => validateGroupMembers(r.members)),
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.groups.balances(groupId),
      queryFn: () =>
        groupService
          .getGroupBalances(groupId)
          .then((r) => validateBalancesData(r)),
    });
  };
}
