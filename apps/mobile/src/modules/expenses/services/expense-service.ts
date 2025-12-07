/**
 * Expense service
 * Handles all expense-related API calls
 */

import { api } from "@/lib/api-client";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseApiResponse,
  ExpensesApiResponse,
  UpdateExpenseInput,
} from "../types";

/**
 * Create a new expense
 */
export async function createExpense(
  input: CreateExpenseInput,
): Promise<ExpenseApiResponse> {
  return api.createExpense(
    input.groupId,
    input.amount,
    input.description,
    input.paidById,
    input.createdById,
    input.currency,
    input.date,
    input.splitParticipants,
    input.splitType,
    input.splitAmounts,
    input.exchangeRate,
  );
}

/**
 * Get a single expense by ID
 */
export async function getExpense(id: string): Promise<ExpenseApiResponse> {
  return api.getExpense(id) as Promise<ExpenseApiResponse>;
}

/**
 * Get all expenses for a group
 */
export async function getGroupExpenses(
  groupId: string,
): Promise<ExpensesApiResponse> {
  return api.getGroupExpenses(groupId) as Promise<ExpensesApiResponse>;
}

/**
 * Update an expense
 */
export async function updateExpense(
  id: string,
  updates: UpdateExpenseInput["updates"],
): Promise<ExpenseApiResponse> {
  return api.updateExpense(id, updates) as Promise<ExpenseApiResponse>;
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<{ message: string }> {
  return api.deleteExpense(id);
}

export const expenseService = {
  createExpense,
  getExpense,
  getGroupExpenses,
  updateExpense,
  deleteExpense,
};
