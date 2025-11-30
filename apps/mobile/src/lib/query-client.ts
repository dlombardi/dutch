/**
 * React Query Client Configuration
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the TanStack Query client for the mobile app.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
      },
    },
  });
}

// Singleton instance
let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

// Query key factories
export const queryKeys = {
  groups: {
    all: ['groups'] as const,
    list: () => [...queryKeys.groups.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
    members: (groupId: string) =>
      [...queryKeys.groups.detail(groupId), 'members'] as const,
    balances: (groupId: string) =>
      [...queryKeys.groups.detail(groupId), 'balances'] as const,
    byInviteCode: (code: string) =>
      [...queryKeys.groups.all, 'invite', code] as const,
  },

  expenses: {
    all: ['expenses'] as const,
    byGroup: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId] as const,
    detail: (id: string) => [...queryKeys.expenses.all, 'detail', id] as const,
  },

  settlements: {
    all: ['settlements'] as const,
    byGroup: (groupId: string) =>
      [...queryKeys.settlements.all, 'group', groupId] as const,
  },

  exchangeRates: {
    all: ['exchangeRates'] as const,
    rate: (from: string, to: string) =>
      [...queryKeys.exchangeRates.all, from, to] as const,
  },
};
