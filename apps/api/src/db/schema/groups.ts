import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  emoji: varchar('emoji', { length: 10 }).notNull().default('💰'),
  defaultCurrency: varchar('default_currency', { length: 3 })
    .notNull()
    .default('USD'),
  inviteCode: varchar('invite_code', { length: 10 }).notNull().unique(),
  isArchived: boolean('is_archived').notNull().default(false),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
