import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

export interface Group {
  id: string;
  name: string;
  emoji: string;
  createdById: string;
  inviteCode: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  previewGroup: Group | null;
  currentGroupMembers: GroupMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createGroup: (
    name: string,
    userId: string,
    emoji?: string,
    defaultCurrency?: string
  ) => Promise<Group | null>;
  fetchGroup: (id: string) => Promise<Group | null>;
  fetchGroupByInviteCode: (inviteCode: string) => Promise<Group | null>;
  fetchGroupMembers: (groupId: string) => Promise<GroupMember[] | null>;
  joinGroup: (inviteCode: string, userId: string) => Promise<Group | null>;
  setCurrentGroup: (group: Group | null) => void;
  clearError: () => void;
}

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      currentGroup: null,
      previewGroup: null,
      currentGroupMembers: [],
      isLoading: false,
      error: null,

      createGroup: async (name, userId, emoji, defaultCurrency) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.createGroup(
            name,
            userId,
            emoji,
            defaultCurrency
          );
          const newGroup = response.group;
          set((state) => ({
            groups: [...state.groups, newGroup],
            currentGroup: newGroup,
          }));
          return newGroup;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create group';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchGroup: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.getGroup(id);
          const group = response.group;

          // Update local groups list if not already present
          set((state) => {
            const existingIndex = state.groups.findIndex((g) => g.id === id);
            if (existingIndex === -1) {
              return { groups: [...state.groups, group], currentGroup: group };
            }
            const updatedGroups = [...state.groups];
            updatedGroups[existingIndex] = group;
            return { groups: updatedGroups, currentGroup: group };
          });

          return group;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch group';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchGroupByInviteCode: async (inviteCode) => {
        set({ isLoading: true, error: null, previewGroup: null });
        try {
          const response = await api.getGroupByInviteCode(inviteCode);
          const group = response.group;
          set({ previewGroup: group });
          return group;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Invalid invite code';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchGroupMembers: async (groupId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.getGroupMembers(groupId);
          const members = response.members;
          set({ currentGroupMembers: members });
          return members;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch members';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      joinGroup: async (inviteCode, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.joinGroup(inviteCode, userId);
          const group = response.group;

          // Add group to local list if not already present
          set((state) => {
            const existingIndex = state.groups.findIndex(
              (g) => g.id === group.id
            );
            if (existingIndex === -1) {
              return {
                groups: [...state.groups, group],
                currentGroup: group,
                previewGroup: null,
              };
            }
            return { currentGroup: group, previewGroup: null };
          });

          return group;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to join group';
          set({ error: errorMessage });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentGroup: (group) => {
        set({ currentGroup: group });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'groups-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        groups: state.groups,
      }),
    }
  )
);
