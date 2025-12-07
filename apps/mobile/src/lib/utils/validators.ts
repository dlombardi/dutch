/**
 * Runtime validators for API responses
 */

import type { Expense } from "@/modules/expenses/types";
import type {
  Group,
  GroupBalancesData,
  GroupMember,
  GroupBalance,
} from "@/modules/groups/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isExpense(value: unknown): value is Expense {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.groupId) &&
    isNumber(value.amount) &&
    isString(value.currency) &&
    isString(value.description) &&
    isString(value.paidById) &&
    isString(value.splitType) &&
    isArray(value.splitParticipants) &&
    isString(value.date) &&
    isString(value.createdById) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function validateExpenses(data: unknown): Expense[] {
  if (!isArray(data)) {
    console.warn("[Validator] Expected array of expenses, got:", typeof data);
    return [];
  }

  const valid: Expense[] = [];
  for (const item of data) {
    if (isExpense(item)) {
      valid.push(item);
    } else {
      console.warn("[Validator] Invalid expense in array:", item);
    }
  }

  return valid;
}

export function validateExpense(data: unknown): Expense {
  if (!isExpense(data)) {
    console.error("[Validator] Invalid expense:", data);
    throw new Error("Invalid expense data received from API");
  }
  return data;
}

export function isGroup(value: unknown): value is Group {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.emoji) &&
    isString(value.defaultCurrency) &&
    isString(value.inviteCode) &&
    isString(value.createdById) &&
    isString(value.createdAt)
  );
}

export function validateGroup(data: unknown): Group {
  if (!isGroup(data)) {
    console.error("[Validator] Invalid group:", data);
    throw new Error("Invalid group data received from API");
  }
  return data;
}

export function isGroupMember(value: unknown): value is GroupMember {
  if (!isObject(value)) return false;

  return (
    isString(value.userId) && isString(value.role) && isString(value.joinedAt)
  );
}

export function validateGroupMembers(data: unknown): GroupMember[] {
  if (!isArray(data)) {
    console.warn("[Validator] Expected array of members, got:", typeof data);
    return [];
  }

  const valid: GroupMember[] = [];
  for (const item of data) {
    if (isGroupMember(item)) {
      valid.push(item);
    } else {
      console.warn("[Validator] Invalid member in array:", item);
    }
  }

  return valid;
}

export function isBalance(value: unknown): value is GroupBalance {
  if (!isObject(value)) return false;

  return (
    isString(value.from) &&
    isString(value.to) &&
    isNumber(value.amount) &&
    isString(value.currency)
  );
}

export function isBalancesData(value: unknown): value is GroupBalancesData {
  if (!isObject(value)) return false;

  if (!isArray(value.balances)) return false;
  if (!isObject(value.memberBalances)) return false;

  for (const balance of value.balances) {
    if (!isBalance(balance)) return false;
  }

  for (const [key, val] of Object.entries(value.memberBalances)) {
    if (!isString(key) || !isNumber(val)) return false;
  }

  return true;
}

export function validateBalancesData(data: unknown): GroupBalancesData {
  if (!isBalancesData(data)) {
    console.error("[Validator] Invalid balances data:", data);
    throw new Error("Invalid balances data received from API");
  }
  return data;
}
