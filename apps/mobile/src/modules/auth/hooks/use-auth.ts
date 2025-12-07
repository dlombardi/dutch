/**
 * useAuth hook
 * Convenient hook for accessing auth state and actions
 */

import { useCallback } from "react";
import { useAuthStore } from "../store";

/**
 * Hook that provides authentication state and actions
 */
export function useAuth() {
  const store = useAuthStore();

  const login = useCallback(
    async (name: string) => {
      await store.loginAsGuest(name);
    },
    [store],
  );

  const sendMagicLink = useCallback(
    async (email: string) => {
      return store.requestMagicLink(email);
    },
    [store],
  );

  const verifyMagicLink = useCallback(
    async (token: string) => {
      return store.verifyMagicLink(token);
    },
    [store],
  );

  const logout = useCallback(() => {
    store.logout();
  }, [store]);

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    hasHydrated: store._hasHydrated,
    magicLinkSent: store.magicLinkSent,
    magicLinkEmail: store.magicLinkEmail,

    // Actions
    login,
    sendMagicLink,
    verifyMagicLink,
    logout,
    clearError: store.clearError,
    resetMagicLinkState: store.resetMagicLinkState,
  };
}
