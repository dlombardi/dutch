import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryClient';
import { useGroupsStore, type Group } from '../../stores/groupsStore';

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
 * - Updates both React Query cache and Zustand store
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
      // Update React Query cache
      queryClient.setQueryData<Group[]>(queryKeys.groups.list(), (old) =>
        old ? [...old, newGroup] : [newGroup]
      );
      queryClient.setQueryData(queryKeys.groups.detail(newGroup.id), newGroup);

      // Update Zustand store (persists to AsyncStorage)
      const { groups } = useGroupsStore.getState();
      if (!groups.some((g) => g.id === newGroup.id)) {
        useGroupsStore.setState({ groups: [...groups, newGroup] });
      }
    },
  });
}

/**
 * Mutation hook for joining a group via invite code.
 *
 * Features:
 * - Updates both React Query cache and Zustand store
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
      // Update React Query cache
      queryClient.setQueryData<Group[]>(queryKeys.groups.list(), (old) => {
        if (!old) return [joinedGroup];
        if (old.some((g) => g.id === joinedGroup.id)) {
          return old;
        }
        return [...old, joinedGroup];
      });
      queryClient.setQueryData(queryKeys.groups.detail(joinedGroup.id), joinedGroup);

      // Invalidate the invite code query (it's been used)
      queryClient.removeQueries({
        queryKey: queryKeys.groups.byInviteCode(joinedGroup.inviteCode),
      });

      // Update Zustand store (persists to AsyncStorage)
      const { groups } = useGroupsStore.getState();
      if (!groups.some((g) => g.id === joinedGroup.id)) {
        useGroupsStore.setState({ groups: [...groups, joinedGroup] });
      }
    },
  });
}
