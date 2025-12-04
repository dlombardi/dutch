import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  date,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';

export const splitTypeEnum = pgEnum('split_type', [
  'equal',
  'exact',
  'percentage',
  'shares',
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'food',
  'transport',
  'accommodation',
  'activity',
  'shopping',
  'other',
]);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    category: expenseCategoryEnum('category'),
    paidById: uuid('paid_by_id')
      .notNull()
      .references(() => users.id),
    splitType: splitTypeEnum('split_type').notNull().default('equal'),
    date: date('date').notNull(),
    notes: text('notes'),
    photoUrl: text('photo_url'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_expenses_group_id').on(table.groupId),
    index('idx_expenses_paid_by_id').on(table.paidById),
    index('idx_expenses_created_at').on(table.createdAt),
  ],
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
