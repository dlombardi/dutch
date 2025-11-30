import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { api, registerTokenGetter } from '../lib/api';
import { logger } from '../lib/logger';

// Generate or retrieve a persistent device ID
const DEVICE_ID_KEY = 'evn-device-id';

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a cryptographically secure UUID
    deviceId = await Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

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
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  loginAsGuest: (name: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<boolean>;
  verifyMagicLink: (token: string) => Promise<boolean>;
  claimAccount: (email: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  resetMagicLinkState: () => void;
  setHasHydrated: (value: boolean) => void;
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
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      loginAsGuest: async (name) => {
        set({ isLoading: true, error: null });
        try {
          const deviceId = await getOrCreateDeviceId();
          const response = await api.createGuestUser(name, deviceId);
          // Token is stored in state and read by API client via registerTokenGetter (P2-001 fix)
          const user = {
            id: response.user.id,
            name: response.user.name,
            type: response.user.type,
            createdAt: response.user.createdAt,
          };
          set({
            user,
            accessToken: response.accessToken,
            isAuthenticated: true,
          });
          // Set user context for error tracking
          logger.setUser({ id: user.id, name: user.name });
          logger.info('Guest user logged in', { userId: user.id });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to login as guest';
          logger.error('Guest login failed', error);
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
          logger.info('Magic link requested', { email });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to send magic link';
          logger.error('Magic link request failed', error, { email });
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
          // Token is stored in state and read by API client via registerTokenGetter (P2-001 fix)
          const user = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            type: response.user.type,
            createdAt: response.user.createdAt,
          };
          set({
            user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            magicLinkSent: false,
            magicLinkEmail: null,
          });
          // Set user context for error tracking
          logger.setUser({ id: user.id, email: user.email, name: user.name });
          logger.info('Magic link verified', { userId: user.id });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to verify magic link';
          logger.error('Magic link verification failed', error);
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
        // Token is cleared from state, API client reads null via registerTokenGetter (P2-001 fix)
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          magicLinkSent: false,
          magicLinkEmail: null,
          error: null,
        });
        // Clear user context from error tracking
        logger.setUser(null);
        logger.info('User logged out');
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
      onRehydrateStorage: () => (state) => {
        // Mark store as hydrated
        useAuthStore.getState().setHasHydrated(true);
      },
    }
  )
);

// Register token getter with API client (P2-001 fix: single source of truth)
// This runs once when the module loads, providing the API client a way to
// always get the current token from the store without storing it separately.
registerTokenGetter(() => useAuthStore.getState().accessToken);
