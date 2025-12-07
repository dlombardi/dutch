import type { Settlement } from "@/modules/settlements/types";

export const mockSettlement: Settlement = {
  id: "settlement-1",
  groupId: "group-1",
  fromUserId: "user-2",
  toUserId: "user-1",
  amount: 42.75,
  currency: "USD",
  method: "cash",
  createdById: "user-2",
  createdAt: "2025-11-28T14:00:00Z",
};

export const mockSettlementVenmo: Settlement = {
  id: "settlement-2",
  groupId: "group-1",
  fromUserId: "user-3",
  toUserId: "user-1",
  amount: 15.25,
  currency: "USD",
  method: "venmo",
  createdById: "user-3",
  createdAt: "2025-11-28T15:00:00Z",
};

export const mockSettlements: Settlement[] = [
  mockSettlement,
  mockSettlementVenmo,
];
