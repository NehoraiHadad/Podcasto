import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id'), // References auth.users
  role: text('role').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
}); 