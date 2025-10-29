import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { episodes } from './episodes';

export const sentEpisodes = pgTable('sent_episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id'), // References auth.users
  episode_id: uuid('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
  sent_at: timestamp('sent_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  // Composite index for checking if episode was sent to user (used in duplicate prevention)
  episodeUserIdx: index('sent_episodes_episode_user_idx').on(table.episode_id, table.user_id),
  // Index for looking up all episodes sent to a user
  userIdIdx: index('sent_episodes_user_id_idx').on(table.user_id)
})); 