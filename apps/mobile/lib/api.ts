// API configuration for Evn mobile app
// In development, we connect to the local API server

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'  // iOS simulator
  : 'https://api.evn.app';   // Production

// For Android emulator, use 10.0.2.2 instead of localhost
// const API_BASE_URL = __DEV__ ? 'http://10.0.2.2:3001' : 'https://api.evn.app';

export interface ApiErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

// Default request timeout (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Base class for all API-related errors
 */
export abstract class BaseApiError extends Error {
  abstract readonly isNetworkError: boolean;
  abstract readonly isServerError: boolean;
  abstract readonly isUserRecoverable: boolean;
}

/**
 * Error for network connectivity issues (no internet, DNS failure, etc.)
 * User can recover by checking their connection
 */
export class NetworkError extends BaseApiError {
  readonly isNetworkError = true;
  readonly isServerError = false;
  readonly isUserRecoverable = true;

  constructor(originalError?: Error) {
    super(originalError?.message || 'Network connection failed. Please check your internet connection.');
    this.name = 'NetworkError';
    this.cause = originalError;
  }
}

/**
 * Error for request timeouts
 * User can retry the request
 */
export class RequestTimeoutError extends BaseApiError {
  readonly isNetworkError = true;
  readonly isServerError = false;
  readonly isUserRecoverable = true;
  readonly url: string;
  readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(`Request timed out. Please try again.`);
    this.name = 'RequestTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Error for API/server errors (4xx, 5xx responses)
 * May or may not be user recoverable depending on status code
 */
export class ApiError extends BaseApiError {
  readonly isNetworkError = false;
  readonly isServerError: boolean;
  readonly isUserRecoverable: boolean;
  readonly statusCode: number;
  readonly errorCode?: string;
  readonly details?: string | string[];

  constructor(response: ApiErrorResponse) {
    const message = Array.isArray(response.message)
      ? response.message.join(', ')
      : response.message;
    super(message);
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.errorCode = response.error;
    this.details = response.message;
    // 4xx errors are client errors (often user recoverable)
    // 5xx errors are server errors (usually not user recoverable)
    this.isServerError = response.statusCode >= 500;
    // 400, 401, 403, 404, 422 are often user recoverable
    this.isUserRecoverable = response.statusCode < 500;
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * Check if this is a not found error
   */
  isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }
}

/**
 * Type guard to check if an error is a network-related error
 */
export function isNetworkError(error: unknown): error is NetworkError | RequestTimeoutError {
  return error instanceof NetworkError || error instanceof RequestTimeoutError;
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get a user-friendly error message for any error
 */
export function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    if (error instanceof RequestTimeoutError) {
      return 'The request took too long. Please try again.';
    }
    return 'Unable to connect. Please check your internet connection.';
  }

  if (isApiError(error)) {
    if (error.isAuthError()) {
      return 'Please sign in again to continue.';
    }
    if (error.isNotFoundError()) {
      return 'The requested item was not found.';
    }
    if (error.isValidationError()) {
      return error.message || 'Please check your input and try again.';
    }
    if (error.isServerError) {
      return 'Something went wrong on our end. Please try again later.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

// Token getter function - will be set by authStore to avoid circular dependency
let getAccessToken: (() => string | null) | null = null;

/**
 * Register a function to get the access token.
 * This is called by authStore during initialization to provide
 * a single source of truth for the token. (P2-001 fix)
 */
export function registerTokenGetter(getter: () => string | null): void {
  getAccessToken = getter;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * @deprecated Use registerTokenGetter instead. Kept for backward compatibility during migration.
   */
  setAccessToken(_token: string | null): void {
    // No-op: Token is now read from authStore via registerTokenGetter
    // This method exists only for backward compatibility
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = getAccessToken?.() ?? null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (__DEV__) {
      console.log(`[API] ${options.method || 'GET'} ${endpoint}`, {
        hasToken: !!accessToken,
        tokenPrefix: accessToken?.substring(0, 20),
      });
    }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        if (__DEV__) {
          console.log(`[API] Error ${response.status}:`, data);
        }
        // Throw structured API error
        throw new ApiError(data as ApiErrorResponse);
      }

      return data as T;
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);

      // If it's already one of our custom errors, re-throw it
      if (error instanceof ApiError || error instanceof NetworkError || error instanceof RequestTimeoutError) {
        throw error;
      }

      // Check if error was due to abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new RequestTimeoutError(url, timeoutMs);
        if (__DEV__) {
          console.log(`[API] Request timed out:`, timeoutError.message);
        }
        throw timeoutError;
      }

      // Check for network errors (TypeError from fetch usually means network issue)
      if (error instanceof TypeError) {
        const networkError = new NetworkError(error);
        if (__DEV__) {
          console.log(`[API] Network error:`, networkError.message);
        }
        throw networkError;
      }

      if (__DEV__) {
        console.log(`[API] Request failed:`, error);
      }
      throw error;
    }
  }

  // Auth endpoints
  async requestMagicLink(email: string): Promise<{ message: string }> {
    return this.request('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyMagicLink(token: string): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      type: 'guest' | 'claimed' | 'full';
      createdAt: string;
      updatedAt: string;
    };
    accessToken: string;
  }> {
    return this.request('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async createGuestUser(
    name: string,
    deviceId: string
  ): Promise<{
    user: {
      id: string;
      name: string;
      type: 'guest';
      authProvider: 'guest';
      deviceId: string;
      createdAt: string;
      updatedAt: string;
    };
    accessToken: string;
  }> {
    return this.request('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name, deviceId }),
    });
  }

  // Groups endpoints
  async createGroup(
    name: string,
    createdById: string,
    emoji?: string,
    defaultCurrency?: string
  ): Promise<{
    group: {
      id: string;
      name: string;
      emoji: string;
      createdById: string;
      inviteCode: string;
      defaultCurrency: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, createdById, emoji, defaultCurrency }),
    });
  }

  async getGroup(id: string): Promise<{
    group: {
      id: string;
      name: string;
      emoji: string;
      createdById: string;
      inviteCode: string;
      defaultCurrency: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request(`/groups/${id}`, {
      method: 'GET',
    });
  }

  async getGroupByInviteCode(inviteCode: string): Promise<{
    group: {
      id: string;
      name: string;
      emoji: string;
      createdById: string;
      inviteCode: string;
      defaultCurrency: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request(`/groups/invite/${inviteCode}`, {
      method: 'GET',
    });
  }

  async joinGroup(
    inviteCode: string,
    userId: string
  ): Promise<{
    group: {
      id: string;
      name: string;
      emoji: string;
      createdById: string;
      inviteCode: string;
      defaultCurrency: string;
      createdAt: string;
      updatedAt: string;
    };
    membership: {
      userId: string;
      role: 'admin' | 'member';
      joinedAt: string;
    };
  }> {
    return this.request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode, userId }),
    });
  }

  async getGroupMembers(groupId: string): Promise<{
    members: {
      userId: string;
      role: 'admin' | 'member';
      joinedAt: string;
    }[];
  }> {
    return this.request(`/groups/${groupId}/members`, {
      method: 'GET',
    });
  }

  async getGroupBalances(groupId: string): Promise<{
    balances: {
      from: string;
      to: string;
      amount: number;
      currency: string;
    }[];
    memberBalances: Record<string, number>;
  }> {
    return this.request(`/groups/${groupId}/balances`, {
      method: 'GET',
    });
  }

  // Expenses endpoints
  async createExpense(
    groupId: string,
    amount: number,
    description: string,
    paidById: string,
    createdById: string,
    currency?: string,
    date?: string,
    splitParticipants?: string[],
    splitType?: 'equal' | 'exact',
    splitAmounts?: Record<string, number>,
    exchangeRate?: number
  ): Promise<{
    expense: {
      id: string;
      groupId: string;
      amount: number;
      currency: string;
      exchangeRate: number;
      amountInGroupCurrency: number;
      description: string;
      paidById: string;
      splitType: 'equal' | 'exact';
      splitParticipants: string[];
      splitAmounts: Record<string, number>;
      date: string;
      createdById: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        amount,
        description,
        paidById,
        createdById,
        currency,
        date,
        splitParticipants,
        splitType,
        splitAmounts,
        exchangeRate,
      }),
    });
  }

  async getExpense(id: string): Promise<{
    expense: {
      id: string;
      groupId: string;
      amount: number;
      currency: string;
      exchangeRate: number;
      amountInGroupCurrency: number;
      description: string;
      paidById: string;
      splitType: string;
      splitParticipants: string[];
      splitAmounts: Record<string, number>;
      date: string;
      createdById: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request(`/expenses/${id}`, {
      method: 'GET',
    });
  }

  async getGroupExpenses(groupId: string): Promise<{
    expenses: {
      id: string;
      groupId: string;
      amount: number;
      currency: string;
      exchangeRate: number;
      amountInGroupCurrency: number;
      description: string;
      paidById: string;
      splitType: string;
      splitParticipants: string[];
      splitAmounts: Record<string, number>;
      date: string;
      createdById: string;
      createdAt: string;
      updatedAt: string;
    }[];
  }> {
    return this.request(`/groups/${groupId}/expenses`, {
      method: 'GET',
    });
  }

  async updateExpense(
    id: string,
    updates: {
      amount?: number;
      currency?: string;
      description?: string;
      paidById?: string;
      date?: string;
      splitType?: 'equal' | 'exact';
      splitParticipants?: string[];
      splitAmounts?: Record<string, number>;
    }
  ): Promise<{
    expense: {
      id: string;
      groupId: string;
      amount: number;
      currency: string;
      exchangeRate: number;
      amountInGroupCurrency: number;
      description: string;
      paidById: string;
      splitType: 'equal' | 'exact';
      splitParticipants: string[];
      splitAmounts: Record<string, number>;
      date: string;
      createdById: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(id: string): Promise<{ message: string }> {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Settlements endpoints
  async createSettlement(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    createdById: string,
    currency?: string,
    method?: string
  ): Promise<{
    settlement: {
      id: string;
      groupId: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
      currency: string;
      method: string;
      createdById: string;
      createdAt: string;
    };
  }> {
    return this.request('/settlements', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        fromUserId,
        toUserId,
        amount,
        createdById,
        currency,
        method,
      }),
    });
  }

  async getGroupSettlements(groupId: string): Promise<{
    settlements: {
      id: string;
      groupId: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
      currency: string;
      method: string;
      createdById: string;
      createdAt: string;
    }[];
  }> {
    return this.request(`/groups/${groupId}/settlements`, {
      method: 'GET',
    });
  }

  // Exchange rate endpoints
  async getExchangeRate(
    base: string,
    target: string
  ): Promise<{
    base: string;
    target: string;
    rate: number;
    timestamp: string;
  }> {
    return this.request(`/exchange-rates?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`, {
      method: 'GET',
    });
  }

  async getExchangeRates(base: string = 'USD'): Promise<{
    base: string;
    rates: Record<string, number>;
    timestamp: string;
  }> {
    return this.request(`/exchange-rates?base=${encodeURIComponent(base)}`, {
      method: 'GET',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
