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

// Operation types for granular state tracking
export type GroupOperation =
  | 'fetchGroup'
  | 'fetchMembers'
  | 'fetchBalances'
  | 'createGroup'
  | 'joinGroup'
  | 'fetchByInviteCode';

// Loading states per operation
export interface LoadingStates {
  fetchGroup: boolean;
  fetchMembers: boolean;
  fetchBalances: boolean;
  createGroup: boolean;
  joinGroup: boolean;
  fetchByInviteCode: boolean;
}

// Error states per operation
export interface ErrorStates {
  fetchGroup: string | null;
  fetchMembers: string | null;
  fetchBalances: string | null;
  createGroup: string | null;
  joinGroup: string | null;
  fetchByInviteCode: string | null;
}

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  previewGroup: Group | null;
  currentGroupMembers: GroupMember[];
  currentGroupBalances: BalancesData | null;

  // Granular loading and error states (P0-001, P0-002 fixes)
  loadingStates: LoadingStates;
  errors: ErrorStates;

  // Legacy compatibility - computed from granular states
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
  fetchGroupBalances: (groupId: string) => Promise<BalancesData | null>;
  joinGroup: (inviteCode: string, userId: string) => Promise<Group | null>;
  setCurrentGroup: (group: Group | null) => void;

  // Granular error/loading management
  clearError: (operation?: GroupOperation) => void;
  clearAllErrors: () => void;
  isOperationLoading: (operation: GroupOperation) => boolean;
  getOperationError: (operation: GroupOperation) => string | null;
}

// Helper to get initial loading states
const initialLoadingStates: LoadingStates = {
  fetchGroup: false,
  fetchMembers: false,
  fetchBalances: false,
  createGroup: false,
  joinGroup: false,
  fetchByInviteCode: false,
};

// Helper to get initial error states
const initialErrorStates: ErrorStates = {
  fetchGroup: null,
  fetchMembers: null,
  fetchBalances: null,
  createGroup: null,
  joinGroup: null,
  fetchByInviteCode: null,
};

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      currentGroup: null,
      previewGroup: null,
      currentGroupMembers: [],
      currentGroupBalances: null,
      loadingStates: { ...initialLoadingStates },
      errors: { ...initialErrorStates },

      // Computed legacy compatibility getters
      get isLoading() {
        const state = get();
        return Object.values(state.loadingStates).some(Boolean);
      },
      get error() {
        const state = get();
        // Return first non-null error for backward compatibility
        return Object.values(state.errors).find((e) => e !== null) ?? null;
      },

      createGroup: async (name, userId, emoji, defaultCurrency) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, createGroup: true },
          errors: { ...state.errors, createGroup: null },
        }));
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
            loadingStates: { ...state.loadingStates, createGroup: false },
          }));
          return newGroup;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create group';
          set((state) => ({
            errors: { ...state.errors, createGroup: errorMessage },
            loadingStates: { ...state.loadingStates, createGroup: false },
          }));
          return null;
        }
      },

      fetchGroup: async (id) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchGroup: true },
          errors: { ...state.errors, fetchGroup: null },
        }));
        try {
          const response = await api.getGroup(id);
          const group = response.group;

          // Update local groups list if not already present
          set((state) => {
            const existingIndex = state.groups.findIndex((g) => g.id === id);
            if (existingIndex === -1) {
              return {
                groups: [...state.groups, group],
                currentGroup: group,
                loadingStates: { ...state.loadingStates, fetchGroup: false },
              };
            }
            const updatedGroups = [...state.groups];
            updatedGroups[existingIndex] = group;
            return {
              groups: updatedGroups,
              currentGroup: group,
              loadingStates: { ...state.loadingStates, fetchGroup: false },
            };
          });

          return group;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch group';
          set((state) => ({
            errors: { ...state.errors, fetchGroup: errorMessage },
            loadingStates: { ...state.loadingStates, fetchGroup: false },
          }));
          return null;
        }
      },

      fetchGroupByInviteCode: async (inviteCode) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchByInviteCode: true },
          errors: { ...state.errors, fetchByInviteCode: null },
          previewGroup: null,
        }));
        try {
          const response = await api.getGroupByInviteCode(inviteCode);
          const group = response.group;
          set((state) => ({
            previewGroup: group,
            loadingStates: { ...state.loadingStates, fetchByInviteCode: false },
          }));
          return group;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Invalid invite code';
          set((state) => ({
            errors: { ...state.errors, fetchByInviteCode: errorMessage },
            loadingStates: { ...state.loadingStates, fetchByInviteCode: false },
          }));
          return null;
        }
      },

      fetchGroupMembers: async (groupId) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchMembers: true },
          errors: { ...state.errors, fetchMembers: null },
        }));
        try {
          const response = await api.getGroupMembers(groupId);
          const members = response.members;
          set((state) => ({
            currentGroupMembers: members,
            loadingStates: { ...state.loadingStates, fetchMembers: false },
          }));
          return members;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch members';
          set((state) => ({
            errors: { ...state.errors, fetchMembers: errorMessage },
            loadingStates: { ...state.loadingStates, fetchMembers: false },
          }));
          return null;
        }
      },

      fetchGroupBalances: async (groupId) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, fetchBalances: true },
          errors: { ...state.errors, fetchBalances: null },
        }));
        try {
          const response = await api.getGroupBalances(groupId);
          set((state) => ({
            currentGroupBalances: response,
            loadingStates: { ...state.loadingStates, fetchBalances: false },
          }));
          return response;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch balances';
          set((state) => ({
            errors: { ...state.errors, fetchBalances: errorMessage },
            loadingStates: { ...state.loadingStates, fetchBalances: false },
          }));
          return null;
        }
      },

      joinGroup: async (inviteCode, userId) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, joinGroup: true },
          errors: { ...state.errors, joinGroup: null },
        }));
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
                loadingStates: { ...state.loadingStates, joinGroup: false },
              };
            }
            return {
              currentGroup: group,
              previewGroup: null,
              loadingStates: { ...state.loadingStates, joinGroup: false },
            };
          });

          return group;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to join group';
          set((state) => ({
            errors: { ...state.errors, joinGroup: errorMessage },
            loadingStates: { ...state.loadingStates, joinGroup: false },
          }));
          return null;
        }
      },

      setCurrentGroup: (group) => {
        set({ currentGroup: group });
      },

      // Clear a specific operation's error, or all errors if no operation specified
      clearError: (operation) => {
        if (operation) {
          set((state) => ({
            errors: { ...state.errors, [operation]: null },
          }));
        } else {
          // Legacy behavior: clear all errors
          set({ errors: { ...initialErrorStates } });
        }
      },

      clearAllErrors: () => {
        set({ errors: { ...initialErrorStates } });
      },

      // Helper to check if a specific operation is loading
      isOperationLoading: (operation) => {
        return get().loadingStates[operation];
      },

      // Helper to get error for a specific operation
      getOperationError: (operation) => {
        return get().errors[operation];
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

// Selector hooks for convenience
export const useGroupsLoading = () =>
  useGroupsStore((state) => state.loadingStates);
export const useGroupsErrors = () => useGroupsStore((state) => state.errors);
export const useIsAnyGroupOperationLoading = () =>
  useGroupsStore((state) => Object.values(state.loadingStates).some(Boolean));
