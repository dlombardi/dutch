/**
 * Settlement service
 * Handles all settlement-related API calls
 */

import { api } from '@/lib/api-client';
import type {
  CreateSettlementInput,
  SettlementApiResponse,
  SettlementsApiResponse,
} from '../types';

/**
 * Create a new settlement
 */
export async function createSettlement(
  input: CreateSettlementInput
): Promise<SettlementApiResponse> {
  return api.createSettlement(
    input.groupId,
    input.fromUserId,
    input.toUserId,
    input.amount,
    input.createdById,
    input.currency,
    input.method
  );
}

/**
 * Get all settlements for a group
 */
export async function getGroupSettlements(
  groupId: string
): Promise<SettlementsApiResponse> {
  return api.getGroupSettlements(groupId);
}

export const settlementService = {
  createSettlement,
  getGroupSettlements,
};
