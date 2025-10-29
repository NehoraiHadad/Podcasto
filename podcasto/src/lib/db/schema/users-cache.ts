import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const usersCache = pgTable('users_cache', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  created_at: timestamp('created_at', { withTimezone: true })
});
