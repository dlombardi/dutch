import { create } from 'zustand';

export interface GroupMember {
  userId: string;
  name: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  defaultCurrency: string;
  inviteCode: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;

  // Actions
  setGroups: (groups: Group[]) => void;
  setCurrentGroup: (group: Group | null) => void;
  createGroup: (name: string, emoji: string, currency: string) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,

  setGroups: (groups) => set({ groups }),

  setCurrentGroup: (group) => set({ currentGroup: group }),

  createGroup: async (name, emoji, currency) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to create group
      const newGroup: Group = {
        id: `group_${Date.now()}`,
        name,
        emoji,
        defaultCurrency: currency,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({ groups: [...state.groups, newGroup] }));
      return newGroup;
    } finally {
      set({ isLoading: false });
    }
  },

  joinGroup: async (inviteCode) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to join group
      throw new Error('Not implemented');
    } finally {
      set({ isLoading: false });
    }
  },

  leaveGroup: async (groupId) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to leave group
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  updateGroup: async (groupId, updates) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to update group
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
        ),
        currentGroup:
          state.currentGroup?.id === groupId
            ? { ...state.currentGroup, ...updates, updatedAt: new Date().toISOString() }
            : state.currentGroup,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      // TODO: Call API to fetch groups
      // For now, groups are stored locally
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGroup: async (groupId) => {
    set({ isLoading: true });
    try {
      // TODO: Call API to fetch single group
      const { groups } = get();
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        set({ currentGroup: group });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
