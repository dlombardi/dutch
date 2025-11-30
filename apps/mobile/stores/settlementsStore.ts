/**
 * Settlement types for use throughout the app.
 *
 * NOTE: This store has been simplified. All settlement data fetching, caching,
 * and mutations are now handled by React Query (see hooks/queries/useSettlements.ts
 * and hooks/mutations/useSettlementMutations.ts).
 */

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  method: string;
  createdById: string;
  createdAt: string;
}
