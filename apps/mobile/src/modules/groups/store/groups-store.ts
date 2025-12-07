/**
 * Groups store
 * Zustand store for persisting group list (offline access)
 *
 * NOTE: This store is simplified. All group data fetching, caching,
 * and mutations are handled by React Query. This store only persists
 * the group list to AsyncStorage for offline access.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Group, GroupsStore } from "../types";

export const useGroupsStore = create<GroupsStore>()(
  persist(
    (set) => ({
      // State
      groups: [],

      // Actions
      addGroup: (group: Group) => {
        set((state) => {
          if (state.groups.some((g) => g.id === group.id)) {
            return state;
          }
          return { groups: [...state.groups, group] };
        });
      },

      removeGroup: (groupId: string) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        }));
      },

      updateGroup: (groupId: string, updates: Partial<Group>) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates } : g,
          ),
        }));
      },

      clearGroups: () => {
        set({ groups: [] });
      },
    }),
    {
      name: "groups-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        groups: state.groups,
      }),
    },
  ),
);
