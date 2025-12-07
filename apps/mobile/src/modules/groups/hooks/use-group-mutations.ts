/**
 * useGroupMutations hooks
 * React Query mutation hooks for group CRUD operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { groupService } from "../services";
import { useGroupsStore } from "../store";
import type { CreateGroupInput, Group, JoinGroupInput } from "../types";

/**
 * Mutation hook for creating a group.
 *
 * Features:
 * - Updates both React Query cache and Zustand store (for offline persistence)
 * - Returns the new group for navigation
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const addGroup = useGroupsStore((state) => state.addGroup);

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const response = await groupService.createGroup(input);
      return response.group as Group;
    },

    onSuccess: (newGroup) => {
      // Update React Query cache
      queryClient.setQueryData<Group[]>(queryKeys.groups.list(), (old) =>
        old ? [...old, newGroup] : [newGroup],
      );
      queryClient.setQueryData(queryKeys.groups.detail(newGroup.id), newGroup);

      // Update Zustand store (persists to AsyncStorage for offline access)
      addGroup(newGroup);
    },
  });
}

/**
 * Mutation hook for joining a group via invite code.
 *
 * Features:
 * - Updates both React Query cache and Zustand store (for offline persistence)
 * - Returns the joined group for navigation
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const addGroup = useGroupsStore((state) => state.addGroup);

  return useMutation({
    mutationFn: async (input: JoinGroupInput) => {
      const response = await groupService.joinGroup(
        input.inviteCode,
        input.userId,
      );
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
      queryClient.setQueryData(
        queryKeys.groups.detail(joinedGroup.id),
        joinedGroup,
      );

      // Invalidate the invite code query (it's been used)
      queryClient.removeQueries({
        queryKey: queryKeys.groups.byInviteCode(joinedGroup.inviteCode),
      });

      // Update Zustand store (persists to AsyncStorage for offline access)
      addGroup(joinedGroup);
    },
  });
}
