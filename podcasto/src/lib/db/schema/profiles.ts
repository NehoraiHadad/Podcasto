import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users.id
  display_name: text('display_name'),
  email_notifications: boolean('email_notifications').default(true),
  has_seen_welcome: boolean('has_seen_welcome').default(false),
  unsubscribe_token: uuid('unsubscribe_token').unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
