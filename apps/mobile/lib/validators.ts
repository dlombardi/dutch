/**
 * Runtime validators for API responses.
 * These type guards validate the shape of data at runtime,
 * providing safety against API changes breaking the app.
 */

import type { Expense } from '../stores/expensesStore';
import type { Group, GroupMember, Balance, BalancesData } from '../stores/groupsStore';

/**
 * Validate that a value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Validate that a value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Validate that a value is a number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Validate that a value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for Expense
 */
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

/**
 * Validate and return an array of Expenses, filtering out invalid items
 */
export function validateExpenses(data: unknown): Expense[] {
  if (!isArray(data)) {
    console.warn('[Validator] Expected array of expenses, got:', typeof data);
    return [];
  }

  const valid: Expense[] = [];
  for (const item of data) {
    if (isExpense(item)) {
      valid.push(item);
    } else {
      console.warn('[Validator] Invalid expense in array:', item);
    }
  }

  return valid;
}

/**
 * Validate and return a single Expense or throw
 */
export function validateExpense(data: unknown): Expense {
  if (!isExpense(data)) {
    console.error('[Validator] Invalid expense:', data);
    throw new Error('Invalid expense data received from API');
  }
  return data;
}

/**
 * Type guard for Group
 */
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

/**
 * Validate and return a single Group or throw
 */
export function validateGroup(data: unknown): Group {
  if (!isGroup(data)) {
    console.error('[Validator] Invalid group:', data);
    throw new Error('Invalid group data received from API');
  }
  return data;
}

/**
 * Type guard for GroupMember
 */
export function isGroupMember(value: unknown): value is GroupMember {
  if (!isObject(value)) return false;

  return (
    isString(value.userId) &&
    isString(value.role) &&
    isString(value.joinedAt)
  );
}

/**
 * Validate and return an array of GroupMembers
 */
export function validateGroupMembers(data: unknown): GroupMember[] {
  if (!isArray(data)) {
    console.warn('[Validator] Expected array of members, got:', typeof data);
    return [];
  }

  const valid: GroupMember[] = [];
  for (const item of data) {
    if (isGroupMember(item)) {
      valid.push(item);
    } else {
      console.warn('[Validator] Invalid member in array:', item);
    }
  }

  return valid;
}

/**
 * Type guard for Balance
 */
export function isBalance(value: unknown): value is Balance {
  if (!isObject(value)) return false;

  return (
    isString(value.from) &&
    isString(value.to) &&
    isNumber(value.amount) &&
    isString(value.currency)
  );
}

/**
 * Type guard for BalancesData
 */
export function isBalancesData(value: unknown): value is BalancesData {
  if (!isObject(value)) return false;

  if (!isArray(value.balances)) return false;
  if (!isObject(value.memberBalances)) return false;

  // Validate each balance in the array
  for (const balance of value.balances) {
    if (!isBalance(balance)) return false;
  }

  // Validate memberBalances is a Record<string, number>
  for (const [key, val] of Object.entries(value.memberBalances)) {
    if (!isString(key) || !isNumber(val)) return false;
  }

  return true;
}

/**
 * Validate and return BalancesData or throw
 */
export function validateBalancesData(data: unknown): BalancesData {
  if (!isBalancesData(data)) {
    console.error('[Validator] Invalid balances data:', data);
    throw new Error('Invalid balances data received from API');
  }
  return data;
}
