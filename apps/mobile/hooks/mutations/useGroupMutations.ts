import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import type { Group } from '../../stores/groupsStore';

// Type for create group input
interface CreateGroupInput {
  name: string;
  createdById: string;
  emoji?: string;
  defaultCurrency?: string;
}

// Type for join group input
interface JoinGroupInput {
  inviteCode: string;
  userId: string;
}

/**
 * Mutation hook for creating a group.
 *
 * Features:
 * - Invalidates groups list on success
 * - Returns the new group for navigation
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const response = await api.createGroup(
        input.name,
        input.createdById,
        input.emoji,
        input.defaultCurrency
      );
      return response.group as Group;
    },

    onSuccess: (newGroup) => {
      // Add the new group to the groups list cache
      queryClient.setQueryData<Group[]>(queryKeys.groups.list(), (old) =>
        old ? [...old, newGroup] : [newGroup]
      );

      // Also set the detail cache
      queryClient.setQueryData(queryKeys.groups.detail(newGroup.id), newGroup);
    },
  });
}

/**
 * Mutation hook for joining a group via invite code.
 *
 * Features:
 * - Invalidates groups list on success
 * - Returns the joined group for navigation
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JoinGroupInput) => {
      const response = await api.joinGroup(input.inviteCode, input.userId);
      return response.group as Group;
    },

    onSuccess: (joinedGroup) => {
      // Add the joined group to the groups list cache
      queryClient.setQueryData<Group[]>(queryKeys.groups.list(), (old) => {
        if (!old) return [joinedGroup];
        // Avoid duplicates if already in list
        if (old.some((g) => g.id === joinedGroup.id)) {
          return old;
        }
        return [...old, joinedGroup];
      });

      // Also set the detail cache
      queryClient.setQueryData(queryKeys.groups.detail(joinedGroup.id), joinedGroup);

      // Invalidate the invite code query (it's been used)
      queryClient.removeQueries({
        queryKey: queryKeys.groups.byInviteCode(joinedGroup.inviteCode),
      });
    },
  });
}
