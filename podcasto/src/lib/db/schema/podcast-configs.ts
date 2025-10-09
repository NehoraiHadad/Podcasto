import { pgTable, uuid, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';

export const podcastConfigs = pgTable('podcast_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }),
  content_source: text('content_source').notNull(),
  telegram_channel: text('telegram_channel'),
  telegram_hours: integer('telegram_hours'),
  urls: jsonb('urls').$type<string[]>(),
  creator: text('creator').notNull(),
  podcast_name: text('podcast_name').notNull(),
  slogan: text('slogan'),
  language: text('language').default('english'),
  creativity_level: integer('creativity_level').notNull(),
  is_long_podcast: boolean('is_long_podcast').notNull(),
  discussion_rounds: integer('discussion_rounds').notNull(),
  min_chars_per_round: integer('min_chars_per_round').notNull(),
  conversation_style: text('conversation_style').notNull(),
  speaker1_role: text('speaker1_role').notNull(),
  speaker2_role: text('speaker2_role').notNull(),
  mixing_techniques: jsonb('mixing_techniques').$type<string[]>().notNull(),
  additional_instructions: text('additional_instructions'),
  episode_frequency: integer('episode_frequency').default(7),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}); 