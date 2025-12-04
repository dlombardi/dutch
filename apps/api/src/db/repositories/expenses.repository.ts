import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import {
  expenses,
  Expense,
  NewExpense,
  expenseSplits,
  ExpenseSplit,
  NewExpenseSplit,
} from '../schema';

@Injectable()
export class ExpensesRepository extends BaseRepository {
  async create(
    data: NewExpense,
    splits: Omit<NewExpenseSplit, 'expenseId'>[],
  ): Promise<Expense> {
    return this.db.transaction(async (tx) => {
      const [expense] = await tx.insert(expenses).values(data).returning();

      if (splits.length > 0) {
        const splitsWithExpenseId = splits.map((s) => ({
          ...s,
          expenseId: expense.id,
        }));
        await tx.insert(expenseSplits).values(splitsWithExpenseId);
      }

      return expense;
    });
  }

  async findById(id: string): Promise<Expense | undefined> {
    const [expense] = await this.db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return expense;
  }

  async findByIdWithSplits(
    id: string,
  ): Promise<{ expense: Expense; splits: ExpenseSplit[] } | undefined> {
    const [expense] = await this.db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    if (!expense) return undefined;

    const splits = await this.db
      .select()
      .from(expenseSplits)
      .where(eq(expenseSplits.expenseId, id));

    return { expense, splits };
  }

  async findByGroupId(groupId: string): Promise<Expense[]> {
    return this.db.select().from(expenses).where(eq(expenses.groupId, groupId));
  }

  async findByGroupIdWithSplits(
    groupId: string,
  ): Promise<Array<{ expense: Expense; splits: ExpenseSplit[] }>> {
    // Use a single JOIN query to avoid N+1 problem
    const rows = await this.db
      .select({
        expense: expenses,
        split: expenseSplits,
      })
      .from(expenses)
      .leftJoin(expenseSplits, eq(expenses.id, expenseSplits.expenseId))
      .where(eq(expenses.groupId, groupId));

    // Group splits by expense
    const expenseMap = new Map<
      string,
      { expense: Expense; splits: ExpenseSplit[] }
    >();

    for (const row of rows) {
      const existing = expenseMap.get(row.expense.id);
      if (existing) {
        if (row.split) {
          existing.splits.push(row.split);
        }
      } else {
        expenseMap.set(row.expense.id, {
          expense: row.expense,
          splits: row.split ? [row.split] : [],
        });
      }
    }

    return Array.from(expenseMap.values());
  }

  async update(
    id: string,
    data: Partial<NewExpense>,
    splits?: Omit<NewExpenseSplit, 'expenseId'>[],
  ): Promise<Expense> {
    return this.db.transaction(async (tx) => {
      const [expense] = await tx
        .update(expenses)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(expenses.id, id))
        .returning();

      if (splits !== undefined) {
        await tx.delete(expenseSplits).where(eq(expenseSplits.expenseId, id));
        if (splits.length > 0) {
          const splitsWithExpenseId = splits.map((s) => ({
            ...s,
            expenseId: id,
          }));
          await tx.insert(expenseSplits).values(splitsWithExpenseId);
        }
      }

      return expense;
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(expenses).where(eq(expenses.id, id));
  }

  async getSplits(expenseId: string): Promise<ExpenseSplit[]> {
    return this.db
      .select()
      .from(expenseSplits)
      .where(eq(expenseSplits.expenseId, expenseId));
  }
}
