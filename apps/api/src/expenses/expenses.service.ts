import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { SyncGateway } from '../sync/sync.gateway';
import { ExpensesRepository, GroupsRepository } from '../db/repositories';
import type { Expense, ExpenseSplit } from '../db/schema';
import { ExpenseCategory } from './dto/create-expense.dto';

// Legacy interface for API compatibility
export interface ExpenseData {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInGroupCurrency: number;
  description: string;
  category?: ExpenseCategory;
  paidById: string;
  splitType: 'equal' | 'exact';
  splitParticipants: string[];
  splitAmounts: Record<string, number>;
  date: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to convert database expense + splits to ExpenseData
function toExpenseData(expense: Expense, splits: ExpenseSplit[]): ExpenseData {
  const amount = Number(expense.amount);
  const exchangeRate = expense.exchangeRate ? Number(expense.exchangeRate) : 1;
  const splitAmounts: Record<string, number> = {};

  for (const split of splits) {
    splitAmounts[split.userId] = Number(split.amount);
  }

  return {
    id: expense.id,
    groupId: expense.groupId,
    amount,
    currency: expense.currency,
    exchangeRate,
    amountInGroupCurrency: Math.round(amount * exchangeRate * 100) / 100,
    description: expense.description,
    category: expense.category as ExpenseCategory | undefined,
    paidById: expense.paidById,
    splitType: expense.splitType as 'equal' | 'exact',
    splitParticipants: Object.keys(splitAmounts),
    splitAmounts,
    date: expense.date,
    createdById: expense.createdById,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly groupsRepo: GroupsRepository,
    private readonly expensesRepo: ExpensesRepository,
    @Optional() private readonly syncGateway?: SyncGateway,
  ) {}

  private async getGroupOrThrow(groupId: string) {
    const group = await this.groupsRepo.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

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
        throw new BadRequestException(
          `Split amount for ${userId} cannot be negative`,
        );
      }
    }

    // Check sum matches total (allowing 0.01 tolerance for rounding)
    const sum = entries.reduce((acc, [, amount]) => acc + amount, 0);
    if (Math.abs(sum - totalAmount) > 0.01) {
      throw new BadRequestException(
        `Split amounts must sum to total expense amount. Expected ${totalAmount}, got ${sum.toFixed(2)}`,
      );
    }
  }

  async createExpense(
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
    category?: ExpenseCategory,
  ): Promise<{ expense: ExpenseData }> {
    // Verify group exists and get default currency
    const group = await this.getGroupOrThrow(groupId);

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
          `Exchange rate is required when expense currency (${expenseCurrency}) differs from group default currency (${group.defaultCurrency})`,
        );
      }
      finalExchangeRate = exchangeRate;
    }

    const now = new Date();
    const expenseDate = date || now.toISOString().split('T')[0];

    const finalSplitType: 'equal' | 'exact' = splitType || 'equal';
    let finalSplitAmounts: Record<string, number>;

    if (finalSplitType === 'exact') {
      if (!splitAmounts || Object.keys(splitAmounts).length === 0) {
        throw new BadRequestException(
          'Split amounts are required for exact split type',
        );
      }
      this.validateExactSplitAmounts(amount, splitAmounts);
      finalSplitAmounts = splitAmounts;
    } else {
      // Equal split
      const participants = splitParticipants || [paidById];
      finalSplitAmounts = this.calculateEqualSplits(amount, participants);
    }

    // Create expense in database
    const dbExpense = await this.expensesRepo.create(
      {
        groupId,
        amount: String(amount),
        currency: expenseCurrency,
        description,
        category: category || null,
        paidById,
        splitType: finalSplitType,
        date: expenseDate,
        createdById,
        exchangeRate:
          finalExchangeRate !== 1 ? String(finalExchangeRate) : null,
      },
      Object.entries(finalSplitAmounts).map(([userId, amt]) => ({
        userId,
        amount: String(amt),
      })),
    );

    // Fetch the splits to return complete data
    const splits = await this.expensesRepo.getSplits(dbExpense.id);
    const expense = toExpenseData(dbExpense, splits);

    // Broadcast expense:created event to group members
    if (this.syncGateway) {
      this.syncGateway.broadcastToGroup(groupId, 'expense:created', {
        expense,
      });
    }

    return { expense };
  }

  async getExpenseById(id: string): Promise<{ expense: ExpenseData }> {
    const result = await this.expensesRepo.findByIdWithSplits(id);
    if (!result) {
      throw new NotFoundException('Expense not found');
    }
    return { expense: toExpenseData(result.expense, result.splits) };
  }

  async getExpensesByGroupId(
    groupId: string,
  ): Promise<{ expenses: ExpenseData[] }> {
    // Verify group exists
    await this.getGroupOrThrow(groupId);

    const results = await this.expensesRepo.findByGroupIdWithSplits(groupId);
    const expenses = results.map(({ expense, splits }) =>
      toExpenseData(expense, splits),
    );

    return { expenses };
  }

  async updateExpense(
    id: string,
    updates: {
      amount?: number;
      currency?: string;
      description?: string;
      category?: ExpenseCategory;
      paidById?: string;
      date?: string;
      splitType?: 'equal' | 'exact';
      splitParticipants?: string[];
      splitAmounts?: Record<string, number>;
    },
  ): Promise<{ expense: ExpenseData }> {
    const existing = await this.expensesRepo.findByIdWithSplits(id);
    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    const currentExpense = toExpenseData(existing.expense, existing.splits);

    // Calculate new values
    const newAmount = updates.amount ?? currentExpense.amount;
    const newSplitType = updates.splitType ?? currentExpense.splitType;

    let newSplitAmounts: Record<string, number>;

    if (newSplitType === 'exact') {
      // Changing to or updating exact split
      if (updates.splitAmounts) {
        this.validateExactSplitAmounts(newAmount, updates.splitAmounts);
        newSplitAmounts = updates.splitAmounts;
      } else if (
        updates.splitType === 'exact' &&
        currentExpense.splitType !== 'exact'
      ) {
        // Trying to change to exact without providing amounts
        throw new BadRequestException(
          'Split amounts are required for exact split type',
        );
      } else {
        // Keep existing splits but validate against new amount if changed
        if (updates.amount !== undefined) {
          this.validateExactSplitAmounts(
            newAmount,
            currentExpense.splitAmounts,
          );
        }
        newSplitAmounts = currentExpense.splitAmounts;
      }
    } else {
      // Equal split
      const participants =
        updates.splitParticipants ?? currentExpense.splitParticipants;
      // Recalculate if amount, participants, or split type changed
      if (
        updates.amount !== undefined ||
        updates.splitParticipants !== undefined ||
        updates.splitType === 'equal'
      ) {
        newSplitAmounts = this.calculateEqualSplits(newAmount, participants);
      } else {
        newSplitAmounts = currentExpense.splitAmounts;
      }
    }

    // Update in database
    const dbExpense = await this.expensesRepo.update(
      id,
      {
        amount:
          updates.amount !== undefined ? String(updates.amount) : undefined,
        currency: updates.currency,
        description: updates.description,
        category: updates.category,
        paidById: updates.paidById,
        date: updates.date,
        splitType: updates.splitType,
      },
      Object.entries(newSplitAmounts).map(([userId, amt]) => ({
        userId,
        amount: String(amt),
      })),
    );

    const splits = await this.expensesRepo.getSplits(dbExpense.id);
    const expense = toExpenseData(dbExpense, splits);

    // Broadcast expense:updated event to group members
    if (this.syncGateway) {
      this.syncGateway.broadcastToGroup(expense.groupId, 'expense:updated', {
        expense,
      });
    }

    return { expense };
  }

  async deleteExpense(id: string): Promise<{ message: string }> {
    const existing = await this.expensesRepo.findById(id);
    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    const groupId = existing.groupId;

    // Delete from database (cascade will delete splits)
    await this.expensesRepo.delete(id);

    // Broadcast expense:deleted event to group members
    if (this.syncGateway) {
      this.syncGateway.broadcastToGroup(groupId, 'expense:deleted', {
        expenseId: id,
        groupId,
      });
    }

    return { message: 'Expense deleted successfully' };
  }
}
