import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(), // References auth.users
  podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  // Index for fetching all subscribers of a podcast (used in email notifications)
  podcastIdIdx: index('subscriptions_podcast_id_idx').on(table.podcast_id),
  // Index for looking up subscriptions by user (used in subscription management)
  userIdIdx: index('subscriptions_user_id_idx').on(table.user_id)
})); 