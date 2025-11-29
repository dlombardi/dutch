import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

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
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  magicLinkSent: boolean;
  magicLinkEmail: string | null;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  loginAsGuest: (name: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<boolean>;
  verifyMagicLink: (token: string) => Promise<boolean>;
  claimAccount: (email: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  resetMagicLinkState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      magicLinkSent: false,
      magicLinkEmail: null,
      error: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      loginAsGuest: async (name) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Call API to create guest user
          const guestUser: User = {
            id: `guest_${Date.now()}`,
            name,
            type: 'guest',
            createdAt: new Date().toISOString(),
          };
          set({ user: guestUser, isAuthenticated: true });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to login as guest';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      requestMagicLink: async (email) => {
        set({ isLoading: true, error: null, magicLinkSent: false });
        try {
          await api.requestMagicLink(email);
          set({
            magicLinkSent: true,
            magicLinkEmail: email,
          });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to send magic link';
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyMagicLink: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.verifyMagicLink(token);
          api.setAccessToken(response.accessToken);
          set({
            user: {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              type: response.user.type,
              createdAt: response.user.createdAt,
            },
            accessToken: response.accessToken,
            isAuthenticated: true,
            magicLinkSent: false,
            magicLinkEmail: null,
          });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to verify magic link';
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      claimAccount: async (email) => {
        const { user } = get();
        if (!user || user.type !== 'guest') return;

        set({ isLoading: true, error: null });
        try {
          // TODO: Call API to claim account
          set({
            user: { ...user, email, type: 'claimed' },
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to claim account';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        api.setAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          magicLinkSent: false,
          magicLinkEmail: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      resetMagicLinkState: () => {
        set({
          magicLinkSent: false,
          magicLinkEmail: null,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
