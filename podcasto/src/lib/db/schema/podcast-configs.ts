import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';

export const podcastConfigs = pgTable('podcast_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }).notNull(),
  content_source: text('content_source').notNull(),
  telegram_channel: text('telegram_channel'),
  telegram_hours: integer('telegram_hours'),
  urls: jsonb('urls').$type<string[]>(),
  creator: text('creator').notNull(),
  podcast_name: text('podcast_name').notNull(),
  slogan: text('slogan'),
  // NOTE: language field removed - now using podcasts.language_code instead
  creativity_level: integer('creativity_level').notNull(),
  conversation_style: text('conversation_style').notNull(),
  podcast_format: text('podcast_format').default('multi-speaker'),
  speaker1_role: text('speaker1_role').notNull(),
  speaker2_role: text('speaker2_role'),
  mixing_techniques: jsonb('mixing_techniques').$type<string[]>().notNull(),
  additional_instructions: text('additional_instructions'),
  intro_prompt: text('intro_prompt'),
  outro_prompt: text('outro_prompt'),
  episode_frequency: integer('episode_frequency').default(7),
  target_duration_minutes: integer('target_duration_minutes').default(10),
  channel_access_status: text('channel_access_status').$type<'accessible' | 'no_preview' | 'unknown'>().default('unknown'),
  channel_access_checked_at: timestamp('channel_access_checked_at', { withTimezone: true }),

  // Speaker selection strategy
  speaker_selection_strategy: text('speaker_selection_strategy').$type<'fixed' | 'random' | 'sequence'>().default('fixed').notNull(),
  sequence_dual_count: integer('sequence_dual_count'),
  sequence_single_count: integer('sequence_single_count'),
  sequence_current_speaker_type: text('sequence_current_speaker_type').$type<'multi-speaker' | 'single-speaker'>().default('multi-speaker').notNull(),
  sequence_progress_count: integer('sequence_progress_count').default(0).notNull(),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}); 