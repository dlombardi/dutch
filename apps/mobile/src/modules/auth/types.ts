/**
 * Auth module types
 * Types shared across the auth module
 */

export type UserType = 'guest' | 'claimed' | 'full';

export interface User {
  id: string;
  name: string;
  email?: string;
  type: UserType;
  photoUrl?: string;
  sessionCount?: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  magicLinkSent: boolean;
  magicLinkEmail: string | null;
  error: string | null;
  showUpgradePrompt: boolean;
  upgradePromptDismissedAt: string | null;
  _hasHydrated: boolean;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  loginAsGuest: (name: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<boolean>;
  verifyMagicLink: (token: string) => Promise<boolean>;
  claimAccount: (email: string) => Promise<void>;
  dismissUpgradePrompt: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  resetMagicLinkState: () => void;
  setHasHydrated: (value: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

// API Response types
export interface GuestUserResponse {
  user: {
    id: string;
    name: string;
    type: 'guest';
    authProvider: 'guest';
    deviceId: string;
    sessionCount: number;
    upgradePromptDismissedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  showUpgradePrompt: boolean;
}

export interface MagicLinkVerifyResponse {
  user: {
    id: string;
    email: string;
    name: string;
    type: UserType;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
}
