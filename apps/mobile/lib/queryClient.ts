import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the TanStack Query client for the mobile app.
 *
 * Configuration rationale:
 * - staleTime: 30s - Balance between fresh data and reducing network requests.
 *   Server state for expenses/balances can change, but not usually within 30s.
 * - gcTime: 5min - Keep unused query data in cache for quick back navigation.
 * - retry: 2 - Retry failed requests twice before giving up.
 * - refetchOnWindowFocus: false - Mobile apps don't have window focus events like web.
 * - refetchOnReconnect: true - Refetch when coming back online (important for offline-first).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
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

// Singleton instance for use throughout the app
let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

// Query key factories for type-safe and consistent query keys
export const queryKeys = {
  // Groups
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

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    byGroup: (groupId: string) =>
      [...queryKeys.expenses.all, 'group', groupId] as const,
    detail: (id: string) => [...queryKeys.expenses.all, 'detail', id] as const,
  },

  // Settlements
  settlements: {
    all: ['settlements'] as const,
    byGroup: (groupId: string) =>
      [...queryKeys.settlements.all, 'group', groupId] as const,
  },

  // Exchange rates
  exchangeRates: {
    all: ['exchangeRates'] as const,
    rate: (from: string, to: string) =>
      [...queryKeys.exchangeRates.all, from, to] as const,
  },
};
