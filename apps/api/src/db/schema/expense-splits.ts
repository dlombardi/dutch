import { pgTable, uuid, decimal, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { expenses } from './expenses';

export const expenseSplits = pgTable(
  'expense_splits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    shares: decimal('shares', { precision: 5, scale: 2 }),
    percentage: decimal('percentage', { precision: 5, scale: 2 }),
  },
  (table) => [
    unique('unique_expense_user').on(table.expenseId, table.userId),
    index('idx_expense_splits_expense_id').on(table.expenseId),
    index('idx_expense_splits_user_id').on(table.userId),
  ],
);

export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;
