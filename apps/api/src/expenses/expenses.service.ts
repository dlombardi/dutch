import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GroupsService } from '../groups/groups.service';

export interface ExpenseData {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInGroupCurrency: number;
  description: string;
  paidById: string;
  splitType: 'equal' | 'exact';
  splitParticipants: string[];
  splitAmounts: Record<string, number>;
  date: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ExpensesService {
  // In-memory storage for now (will be replaced with TypeORM later)
  private expenses: Map<string, ExpenseData> = new Map();
  private groupExpenses: Map<string, string[]> = new Map(); // groupId -> expenseIds

  constructor(private readonly groupsService: GroupsService) {}

  private calculateEqualSplits(
    amount: number,
    participants: string[],
  ): Record<string, number> {
    const splitAmounts: Record<string, number> = {};
    const baseAmount = Math.floor((amount * 100) / participants.length) / 100;
    const totalBase = baseAmount * participants.length;
    const remainder = Math.round((amount - totalBase) * 100) / 100;

    participants.forEach((userId, index) => {
      // Give the remainder to the first participant to preserve total
      if (index === 0 && remainder > 0) {
        splitAmounts[userId] = Math.round((baseAmount + remainder) * 100) / 100;
      } else {
        splitAmounts[userId] = baseAmount;
      }
    });

    return splitAmounts;
  }

  private validateExactSplitAmounts(
    totalAmount: number,
    splitAmounts: Record<string, number>,
  ): void {
    const entries = Object.entries(splitAmounts);

    if (entries.length === 0) {
      throw new BadRequestException('Exact split amounts cannot be empty');
    }

    // Check for negative amounts
    for (const [userId, amount] of entries) {
      if (amount < 0) {
        throw new BadRequestException(`Split amount for ${userId} cannot be negative`);
      }
    }

    // Check sum matches total (allowing 0.01 tolerance for rounding)
    const sum = entries.reduce((acc, [, amount]) => acc + amount, 0);
    if (Math.abs(sum - totalAmount) > 0.01) {
      throw new BadRequestException(
        `Split amounts must sum to total expense amount. Expected ${totalAmount}, got ${sum.toFixed(2)}`
      );
    }
  }

  createExpense(
    groupId: string,
    amount: number,
    description: string,
    paidById: string,
    createdById: string,
    currency?: string,
    date?: string,
    splitParticipants?: string[],
    splitType?: 'equal' | 'exact',
    splitAmounts?: Record<string, number>,
    exchangeRate?: number,
  ): { expense: ExpenseData } {
    // Verify group exists and get default currency
    const { group } = this.groupsService.getGroupById(groupId);

    const expenseCurrency = currency || group.defaultCurrency;

    // Handle exchange rate logic
    let finalExchangeRate: number;
    if (expenseCurrency === group.defaultCurrency) {
      // Same currency as group default - exchange rate is 1.0
      finalExchangeRate = 1;
    } else {
      // Different currency - exchange rate is required
      if (exchangeRate === undefined || exchangeRate === null) {
        throw new BadRequestException(
          `Exchange rate is required when expense currency (${expenseCurrency}) differs from group default currency (${group.defaultCurrency})`
        );
      }
      finalExchangeRate = exchangeRate;
    }

    // Calculate amount in group currency
    const amountInGroupCurrency = Math.round(amount * finalExchangeRate * 100) / 100;

    const expenseId = randomBytes(16).toString('hex');
    const now = new Date();
    const expenseDate = date || now.toISOString().split('T')[0];

    let finalSplitType: 'equal' | 'exact' = splitType || 'equal';
    let finalSplitParticipants: string[];
    let finalSplitAmounts: Record<string, number>;

    if (finalSplitType === 'exact') {
      if (!splitAmounts || Object.keys(splitAmounts).length === 0) {
        throw new BadRequestException('Split amounts are required for exact split type');
      }
      this.validateExactSplitAmounts(amount, splitAmounts);
      finalSplitAmounts = splitAmounts;
      finalSplitParticipants = Object.keys(splitAmounts);
    } else {
      // Equal split
      finalSplitParticipants = splitParticipants || [paidById];
      finalSplitAmounts = this.calculateEqualSplits(amount, finalSplitParticipants);
    }

    const expense: ExpenseData = {
      id: expenseId,
      groupId,
      amount,
      currency: expenseCurrency,
      exchangeRate: finalExchangeRate,
      amountInGroupCurrency,
      description,
      paidById,
      splitType: finalSplitType,
      splitParticipants: finalSplitParticipants,
      splitAmounts: finalSplitAmounts,
      date: expenseDate,
      createdById,
      createdAt: now,
      updatedAt: now,
    };

    this.expenses.set(expenseId, expense);

    // Track expense in group's expense list
    const groupExpenseIds = this.groupExpenses.get(groupId) || [];
    groupExpenseIds.push(expenseId);
    this.groupExpenses.set(groupId, groupExpenseIds);

    return { expense };
  }

  getExpenseById(id: string): { expense: ExpenseData } {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return { expense };
  }

  getExpensesByGroupId(groupId: string): { expenses: ExpenseData[] } {
    // Verify group exists
    this.groupsService.getGroupById(groupId);

    const expenseIds = this.groupExpenses.get(groupId) || [];
    const expenses = expenseIds
      .map((id) => this.expenses.get(id))
      .filter((expense): expense is ExpenseData => expense !== undefined);

    return { expenses };
  }

  updateExpense(
    id: string,
    updates: {
      amount?: number;
      currency?: string;
      description?: string;
      paidById?: string;
      date?: string;
      splitType?: 'equal' | 'exact';
      splitParticipants?: string[];
      splitAmounts?: Record<string, number>;
    },
  ): { expense: ExpenseData } {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Apply basic updates
    if (updates.amount !== undefined) {
      expense.amount = updates.amount;
    }
    if (updates.currency !== undefined) {
      expense.currency = updates.currency;
    }
    if (updates.description !== undefined) {
      expense.description = updates.description;
    }
    if (updates.paidById !== undefined) {
      expense.paidById = updates.paidById;
    }
    if (updates.date !== undefined) {
      expense.date = updates.date;
    }

    // Handle split type changes
    const newSplitType = updates.splitType || expense.splitType;

    if (newSplitType === 'exact') {
      // Changing to or updating exact split
      if (updates.splitAmounts) {
        this.validateExactSplitAmounts(expense.amount, updates.splitAmounts);
        expense.splitAmounts = updates.splitAmounts;
        expense.splitParticipants = Object.keys(updates.splitAmounts);
        expense.splitType = 'exact';
      } else if (updates.splitType === 'exact' && expense.splitType !== 'exact') {
        // Trying to change to exact without providing amounts
        throw new BadRequestException('Split amounts are required for exact split type');
      }
      // If just updating amount and keeping exact split, validate existing amounts
      if (updates.amount !== undefined && expense.splitType === 'exact' && !updates.splitAmounts) {
        this.validateExactSplitAmounts(expense.amount, expense.splitAmounts);
      }
    } else {
      // Equal split
      expense.splitType = 'equal';
      if (updates.splitParticipants !== undefined) {
        expense.splitParticipants = updates.splitParticipants;
      }
      // Recalculate splits if amount or participants changed, or if switching from exact to equal
      if (
        updates.amount !== undefined ||
        updates.splitParticipants !== undefined ||
        updates.splitType === 'equal'
      ) {
        expense.splitAmounts = this.calculateEqualSplits(
          expense.amount,
          expense.splitParticipants,
        );
      }
    }

    expense.updatedAt = new Date();

    this.expenses.set(id, expense);
    return { expense };
  }

  deleteExpense(id: string): { message: string } {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Remove from expenses map
    this.expenses.delete(id);

    // Remove from group's expense list
    const groupExpenseIds = this.groupExpenses.get(expense.groupId);
    if (groupExpenseIds) {
      const index = groupExpenseIds.indexOf(id);
      if (index > -1) {
        groupExpenseIds.splice(index, 1);
      }
      this.groupExpenses.set(expense.groupId, groupExpenseIds);
    }

    return { message: 'Expense deleted successfully' };
  }
}
