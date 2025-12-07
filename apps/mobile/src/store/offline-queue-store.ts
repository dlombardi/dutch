/**
 * Offline Queue Store
 * Zustand store for managing pending expenses when offline
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api-client";
import { isOffline } from "./network-store";
import { logger } from "@/lib/utils/logger";
import { getQueryClient, queryKeys } from "@/lib/query-client";

export interface PendingExpense {
  localId: string;
  groupId: string;
  amount: number;
  currency?: string;
  description: string;
  paidById: string;
  createdById: string;
  date?: string;
  splitParticipants?: string[];
  splitType?: "equal" | "exact";
  splitAmounts?: Record<string, number>;
  exchangeRate?: number;
  createdAt: string;
  isSyncing?: boolean;
  retryCount?: number;
  lastRetryAt?: string;
  errorMessage?: string;
}

const MAX_RETRY_COUNT = 3;

function getRetryDelay(retryCount: number): number {
  return Math.pow(4, retryCount) * 1000;
}

function canRetry(pending: PendingExpense): boolean {
  const retryCount = pending.retryCount ?? 0;
  if (retryCount >= MAX_RETRY_COUNT) return false;
  if (!pending.lastRetryAt) return true;

  const lastRetry = new Date(pending.lastRetryAt).getTime();
  const now = Date.now();
  const delay = getRetryDelay(retryCount);

  return now - lastRetry >= delay;
}

function generateLocalId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface OfflineQueueState {
  pendingExpenses: PendingExpense[];
  isSyncing: boolean;

  queueExpense: (
    expense: Omit<PendingExpense, "localId" | "createdAt">,
  ) => PendingExpense;
  removePendingExpense: (localId: string) => void;
  syncPendingExpenses: () => Promise<void>;
  getFailedPendingExpenses: () => PendingExpense[];
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      pendingExpenses: [],
      isSyncing: false,

      queueExpense: (expenseData) => {
        const pendingExpense: PendingExpense = {
          ...expenseData,
          localId: generateLocalId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          pendingExpenses: [...state.pendingExpenses, pendingExpense],
        }));

        return pendingExpense;
      },

      removePendingExpense: (localId) => {
        set((state) => ({
          pendingExpenses: state.pendingExpenses.filter(
            (p) => p.localId !== localId,
          ),
        }));
      },

      syncPendingExpenses: async () => {
        const { pendingExpenses } = get();
        if (pendingExpenses.length === 0) return;
        if (isOffline()) return;

        const retryablePending = pendingExpenses.filter(canRetry);
        if (retryablePending.length === 0) return;

        set({ isSyncing: true });

        const queryClient = getQueryClient();

        for (const pending of retryablePending) {
          if (pending.isSyncing) continue;

          set((state) => ({
            pendingExpenses: state.pendingExpenses.map((p) =>
              p.localId === pending.localId ? { ...p, isSyncing: true } : p,
            ),
          }));

          try {
            await api.createExpense(
              pending.groupId,
              pending.amount,
              pending.description,
              pending.paidById,
              pending.createdById,
              pending.currency,
              pending.date,
              pending.splitParticipants,
              pending.splitType,
              pending.splitAmounts,
              pending.exchangeRate,
            );

            set((state) => ({
              pendingExpenses: state.pendingExpenses.filter(
                (p) => p.localId !== pending.localId,
              ),
            }));

            queryClient.invalidateQueries({
              queryKey: queryKeys.expenses.byGroup(pending.groupId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.groups.balances(pending.groupId),
            });
          } catch (error) {
            const currentRetryCount = pending.retryCount ?? 0;
            const newRetryCount = currentRetryCount + 1;
            const errorMessage =
              error instanceof Error ? error.message : "Sync failed";

            set((state) => ({
              pendingExpenses: state.pendingExpenses.map((p) =>
                p.localId === pending.localId
                  ? {
                      ...p,
                      isSyncing: false,
                      retryCount: newRetryCount,
                      lastRetryAt: new Date().toISOString(),
                      errorMessage:
                        newRetryCount >= MAX_RETRY_COUNT
                          ? `Failed after ${MAX_RETRY_COUNT} attempts: ${errorMessage}`
                          : errorMessage,
                    }
                  : p,
              ),
            }));

            if (newRetryCount >= MAX_RETRY_COUNT) {
              logger.warn("Pending expense permanently failed", {
                category: "offline-queue",
                localId: pending.localId,
                retryCount: MAX_RETRY_COUNT,
              });
            }
          }
        }

        set({ isSyncing: false });
      },

      getFailedPendingExpenses: () => {
        return get().pendingExpenses.filter(
          (p) => (p.retryCount ?? 0) >= MAX_RETRY_COUNT,
        );
      },
    }),
    {
      name: "offline-queue-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingExpenses: state.pendingExpenses,
      }),
    },
  ),
);
