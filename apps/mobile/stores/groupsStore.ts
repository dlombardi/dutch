import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Group types for use throughout the app.
 *
 * NOTE: This store has been simplified. All group data fetching, caching,
 * and mutations are now handled by React Query (see hooks/queries/useGroup.ts
 * and hooks/mutations/useGroupMutations.ts).
 *
 * The store only persists the group list to AsyncStorage for offline access.
 * React Query mutations update this store when groups are created/joined.
 */

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

export interface Balance {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export interface BalancesData {
  balances: Balance[];
  memberBalances: Record<string, number>;
}

interface GroupsState {
  groups: Group[];

  // Actions for mutations to update the persisted list
  addGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  clearGroups: () => void;
}

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set) => ({
      groups: [],

      addGroup: (group) => {
        set((state) => {
          if (state.groups.some((g) => g.id === group.id)) {
            return state;
          }
          return { groups: [...state.groups, group] };
        });
      },

      removeGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        }));
      },

      updateGroup: (groupId, updates) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
        }));
      },

      clearGroups: () => {
        set({ groups: [] });
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
