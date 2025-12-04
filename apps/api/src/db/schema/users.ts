import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('user_type', ['guest', 'claimed', 'full']);
export const authProviderEnum = pgEnum('auth_provider', [
  'magic_link',
  'google',
  'apple',
  'guest',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabaseAuthId: uuid('supabase_auth_id').unique(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: userTypeEnum('type').notNull().default('guest'),
  authProvider: authProviderEnum('auth_provider').notNull().default('guest'),
  photoUrl: text('photo_url'),
  deviceId: varchar('device_id', { length: 255 }),
  sessionCount: integer('session_count').notNull().default(1),
  upgradePromptDismissedAt: timestamp('upgrade_prompt_dismissed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
