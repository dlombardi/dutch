import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GroupsService } from '../groups/groups.service';

export interface ExpenseData {
  id: string;
  groupId: string;
  amount: number;
  currency: string;
  description: string;
  paidById: string;
  splitType: string;
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

  createExpense(
    groupId: string,
    amount: number,
    description: string,
    paidById: string,
    createdById: string,
    currency?: string,
    date?: string,
  ): { expense: ExpenseData } {
    // Verify group exists and get default currency
    const { group } = this.groupsService.getGroupById(groupId);

    const expenseId = randomBytes(16).toString('hex');
    const now = new Date();
    const expenseDate = date || now.toISOString().split('T')[0];

    const expense: ExpenseData = {
      id: expenseId,
      groupId,
      amount,
      currency: currency || group.defaultCurrency,
      description,
      paidById,
      splitType: 'equal', // default for basic expense
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
}
