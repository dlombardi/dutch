// API configuration for Evn mobile app
// In development, we connect to the local API server

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'  // iOS simulator
  : 'https://api.evn.app';   // Production

// For Android emulator, use 10.0.2.2 instead of localhost
// const API_BASE_URL = __DEV__ ? 'http://10.0.2.2:3001' : 'https://api.evn.app';

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
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
    options: RequestInit = {}
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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (__DEV__) {
          console.log(`[API] Error ${response.status}:`, data);
        }
        throw data as ApiError;
      }

      return data as T;
    } catch (error) {
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
