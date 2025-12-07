/**
 * Auth store
 * Zustand store for authentication state management
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { registerTokenGetter } from "@/lib/api-client";
import { logger } from "@/lib/utils/logger";
import { authService } from "../services";
import type { AuthStore, User } from "../types";

// Device ID management
const DEVICE_ID_KEY = "evn-device-id";

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = await Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      magicLinkSent: false,
      magicLinkEmail: null,
      error: null,
      showUpgradePrompt: false,
      upgradePromptDismissedAt: null,
      claimEmailSent: false,
      claimEmail: null,
      _hasHydrated: false,

      // Actions
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      loginAsGuest: async (name) => {
        set({ isLoading: true, error: null });
        try {
          const deviceId = await getOrCreateDeviceId();
          const response = await authService.createGuestUser(name, deviceId);
          const user: User = {
            id: response.user.id,
            name: response.user.name,
            type: response.user.type,
            sessionCount: response.user.sessionCount,
            createdAt: response.user.createdAt,
          };
          set({
            user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            showUpgradePrompt: response.showUpgradePrompt,
            upgradePromptDismissedAt:
              response.user.upgradePromptDismissedAt || null,
          });
          logger.setUser({ id: user.id, name: user.name });
          logger.info("Guest user logged in", {
            userId: user.id,
            sessionCount: user.sessionCount,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to login as guest";
          logger.error("Guest login failed", error);
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      requestMagicLink: async (email) => {
        set({ isLoading: true, error: null, magicLinkSent: false });
        try {
          await authService.requestMagicLink(email);
          set({
            magicLinkSent: true,
            magicLinkEmail: email,
          });
          logger.info("Magic link requested", { email });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to send magic link";
          logger.error("Magic link request failed", error, { email });
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyMagicLink: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.verifyMagicLink(token);
          const user: User = {
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
          logger.setUser({ id: user.id, email: user.email, name: user.name });
          logger.info("Magic link verified", { userId: user.id });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to verify magic link";
          logger.error("Magic link verification failed", error);
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      claimAccount: async (email) => {
        const { user } = get();
        if (!user || user.type !== "guest") {
          set({ error: "Only guest users can claim an account" });
          return false;
        }

        set({ isLoading: true, error: null, claimEmailSent: false });
        try {
          const deviceId = await getOrCreateDeviceId();
          await authService.claimGuestAccount(deviceId, email);
          set({
            claimEmailSent: true,
            claimEmail: email,
            showUpgradePrompt: false,
          });
          logger.info("Claim account email sent", { email });
          return true;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to claim account";
          logger.error("Claim account failed", error, { email });
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      dismissUpgradePrompt: async () => {
        try {
          const deviceId = await getOrCreateDeviceId();
          await authService.dismissUpgradePrompt(deviceId);
          set({
            showUpgradePrompt: false,
            upgradePromptDismissedAt: new Date().toISOString(),
          });
          logger.info("Upgrade prompt dismissed");
        } catch (error: unknown) {
          logger.error("Failed to dismiss upgrade prompt", error);
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          magicLinkSent: false,
          magicLinkEmail: null,
          error: null,
          showUpgradePrompt: false,
          upgradePromptDismissedAt: null,
        });
        logger.setUser(null);
        logger.info("User logged out");
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

      resetClaimState: () => {
        set({
          claimEmailSent: false,
          claimEmail: null,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        upgradePromptDismissedAt: state.upgradePromptDismissedAt,
      }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.getState().setHasHydrated(true);
      },
    },
  ),
);

// Register token getter with API client
registerTokenGetter(() => useAuthStore.getState().accessToken);
