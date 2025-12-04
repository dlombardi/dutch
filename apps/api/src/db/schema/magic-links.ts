import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const magicLinks = pgTable(
  'magic_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    token: varchar('token', { length: 64 }).notNull().unique(),
    used: boolean('used').default(false).notNull(),
    claimForUserId: uuid('claim_for_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    index('idx_magic_links_email').on(table.email),
    index('idx_magic_links_token').on(table.token),
    index('idx_magic_links_expires_at').on(table.expiresAt),
  ],
);

export type MagicLink = typeof magicLinks.$inferSelect;
export type NewMagicLink = typeof magicLinks.$inferInsert;
