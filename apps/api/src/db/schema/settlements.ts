import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';

export const settlementMethodEnum = pgEnum('settlement_method', [
  'cash',
  'venmo',
  'paypal',
  'zelle',
  'bank_transfer',
  'other',
]);

export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => users.id),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    method: settlementMethodEnum('method').notNull().default('other'),
    notes: text('notes'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    settledAt: timestamp('settled_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_settlements_group_id').on(table.groupId),
    index('idx_settlements_from_user_id').on(table.fromUserId),
    index('idx_settlements_to_user_id').on(table.toUserId),
  ],
);

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
