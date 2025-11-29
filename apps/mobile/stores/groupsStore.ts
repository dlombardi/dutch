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

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
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
  setCurrentGroup: (group: Group | null) => void;
  clearError: () => void;
}

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      currentGroup: null,
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
