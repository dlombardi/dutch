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

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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
}

export const api = new ApiClient(API_BASE_URL);
