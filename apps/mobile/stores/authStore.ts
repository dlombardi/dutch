import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserType = 'guest' | 'claimed' | 'full';

export interface User {
  id: string;
  name: string;
  email?: string;
  type: UserType;
  photoUrl?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  loginAsGuest: (name: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  claimAccount: (email: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      loginAsGuest: async (name) => {
        set({ isLoading: true });
        try {
          // TODO: Call API to create guest user
          const guestUser: User = {
            id: `guest_${Date.now()}`,
            name,
            type: 'guest',
            createdAt: new Date().toISOString(),
          };
          set({ user: guestUser, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithMagicLink: async (email) => {
        set({ isLoading: true });
        try {
          // TODO: Call API to send magic link
          console.log('Magic link sent to:', email);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyMagicLink: async (token) => {
        set({ isLoading: true });
        try {
          // TODO: Call API to verify magic link
          console.log('Verifying magic link:', token);
        } finally {
          set({ isLoading: false });
        }
      },

      claimAccount: async (email) => {
        const { user } = get();
        if (!user || user.type !== 'guest') return;

        set({ isLoading: true });
        try {
          // TODO: Call API to claim account
          set({
            user: { ...user, email, type: 'claimed' },
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
