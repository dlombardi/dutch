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

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data as T;
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
}

export const api = new ApiClient(API_BASE_URL);
