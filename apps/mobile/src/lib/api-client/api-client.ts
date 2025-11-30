/**
 * API Client
 * Handles all HTTP requests to the backend
 */

import type { ApiErrorResponse } from './api-client.types';
import { ApiError, NetworkError, RequestTimeoutError } from './api-errors';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.evn.app';

const DEFAULT_TIMEOUT_MS = 30000;

// Token getter function - set by authStore
let getAccessToken: (() => string | null) | null = null;

/**
 * Register a function to get the access token.
 * Called by authStore during initialization.
 */
export function registerTokenGetter(getter: () => string | null): void {
  getAccessToken = getter;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        if (__DEV__) {
          console.log(`[API] Error ${response.status}:`, data);
        }
        throw new ApiError(data as ApiErrorResponse);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (
        error instanceof ApiError ||
        error instanceof NetworkError ||
        error instanceof RequestTimeoutError
      ) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new RequestTimeoutError(url, timeoutMs);
        if (__DEV__) {
          console.log('[API] Request timed out:', timeoutError.message);
        }
        throw timeoutError;
      }

      if (error instanceof TypeError) {
        const networkError = new NetworkError(error);
        if (__DEV__) {
          console.log('[API] Network error:', networkError.message);
        }
        throw networkError;
      }

      if (__DEV__) {
        console.log('[API] Request failed:', error);
      }
      throw error;
    }
  }

  // Auth endpoints
  async requestMagicLink(email: string) {
    return this.request<{ message: string }>('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyMagicLink(token: string) {
    return this.request<{
      user: {
        id: string;
        email: string;
        name: string;
        type: 'guest' | 'claimed' | 'full';
        createdAt: string;
        updatedAt: string;
      };
      accessToken: string;
    }>('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async createGuestUser(name: string, deviceId: string) {
    return this.request<{
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
    }>('/auth/guest', {
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
  ) {
    return this.request<{
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
    }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, createdById, emoji, defaultCurrency }),
    });
  }

  async getGroup(id: string) {
    return this.request<{
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
    }>(`/groups/${id}`, { method: 'GET' });
  }

  async getGroupByInviteCode(inviteCode: string) {
    return this.request<{
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
    }>(`/groups/invite/${inviteCode}`, { method: 'GET' });
  }

  async joinGroup(inviteCode: string, userId: string) {
    return this.request<{
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
    }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode, userId }),
    });
  }

  async getGroupMembers(groupId: string) {
    return this.request<{
      members: {
        userId: string;
        role: 'admin' | 'member';
        joinedAt: string;
      }[];
    }>(`/groups/${groupId}/members`, { method: 'GET' });
  }

  async getGroupBalances(groupId: string) {
    return this.request<{
      balances: {
        from: string;
        to: string;
        amount: number;
        currency: string;
      }[];
      memberBalances: Record<string, number>;
    }>(`/groups/${groupId}/balances`, { method: 'GET' });
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
  ) {
    return this.request<{
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
    }>('/expenses', {
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

  async getExpense(id: string) {
    return this.request<{
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
    }>(`/expenses/${id}`, { method: 'GET' });
  }

  async getGroupExpenses(groupId: string) {
    return this.request<{
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
    }>(`/groups/${groupId}/expenses`, { method: 'GET' });
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
  ) {
    return this.request<{
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
    }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expenses/${id}`, {
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
  ) {
    return this.request<{
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
    }>('/settlements', {
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

  async getGroupSettlements(groupId: string) {
    return this.request<{
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
    }>(`/groups/${groupId}/settlements`, { method: 'GET' });
  }

  // Exchange rate endpoints
  async getExchangeRate(base: string, target: string) {
    return this.request<{
      base: string;
      target: string;
      rate: number;
      timestamp: string;
    }>(
      `/exchange-rates?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`,
      { method: 'GET' }
    );
  }

  async getExchangeRates(base: string = 'USD') {
    return this.request<{
      base: string;
      rates: Record<string, number>;
      timestamp: string;
    }>(`/exchange-rates?base=${encodeURIComponent(base)}`, { method: 'GET' });
  }
}

export const api = new ApiClient(API_BASE_URL);
