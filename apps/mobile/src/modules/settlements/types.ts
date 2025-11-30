/**
 * Settlements module types
 * Types shared across the settlements module
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

export interface CreateSettlementInput {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  createdById: string;
  currency?: string;
  method?: string;
}

// API Response types
export interface SettlementApiResponse {
  settlement: Settlement;
}

export interface SettlementsApiResponse {
  settlements: Settlement[];
}
