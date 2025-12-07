/**
 * Group service
 * Handles all group-related API calls
 */

import { api } from "@/lib/api-client";
import type {
  CreateGroupInput,
  Group,
  GroupApiResponse,
  GroupBalancesApiResponse,
  GroupMembersApiResponse,
  JoinGroupApiResponse,
} from "../types";

/**
 * Create a new group
 */
export async function createGroup(
  input: CreateGroupInput,
): Promise<GroupApiResponse> {
  return api.createGroup(
    input.name,
    input.createdById,
    input.emoji,
    input.defaultCurrency,
  );
}

/**
 * Get a single group by ID
 */
export async function getGroup(id: string): Promise<GroupApiResponse> {
  return api.getGroup(id);
}

/**
 * Get a group by its invite code (for join preview)
 */
export async function getGroupByInviteCode(
  inviteCode: string,
): Promise<GroupApiResponse> {
  return api.getGroupByInviteCode(inviteCode);
}

/**
 * Join a group via invite code
 */
export async function joinGroup(
  inviteCode: string,
  userId: string,
): Promise<JoinGroupApiResponse> {
  return api.joinGroup(inviteCode, userId);
}

/**
 * Get members for a group
 */
export async function getGroupMembers(
  groupId: string,
): Promise<GroupMembersApiResponse> {
  return api.getGroupMembers(groupId);
}

/**
 * Get balances for a group
 */
export async function getGroupBalances(
  groupId: string,
): Promise<GroupBalancesApiResponse> {
  return api.getGroupBalances(groupId);
}

export const groupService = {
  createGroup,
  getGroup,
  getGroupByInviteCode,
  joinGroup,
  getGroupMembers,
  getGroupBalances,
};
