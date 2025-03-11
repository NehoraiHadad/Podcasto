import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { episodes } from './episodes';

export const sentEpisodes = pgTable('sent_episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(), // References auth.users
  episode_id: uuid('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
  sent_at: timestamp('sent_at', { withTimezone: true }).defaultNow()
}); 