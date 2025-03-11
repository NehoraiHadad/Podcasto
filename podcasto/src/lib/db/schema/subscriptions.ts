import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(), // References auth.users
  podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
}); 