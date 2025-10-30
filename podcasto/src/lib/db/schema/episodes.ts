import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';
import { profiles } from './profiles';

export const episodes = pgTable('episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language').notNull(),
  audio_url: text('audio_url').notNull(),
  audio_format: text('audio_format').default('mp3'), // 'wav' | 'mp3'
  duration: integer('duration'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  published_at: timestamp('published_at', { withTimezone: true }),
  status: text('status'),
  metadata: text('metadata'),
  cover_image: text('cover_image'),
  script_url: text('script_url'),
  analysis: jsonb('analysis'),
  metadata_url: text('metadata_url'),
  source_data_ref: text('source_data_ref'),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  speaker2_role: text('speaker2_role'),
  content_start_date: timestamp('content_start_date', { withTimezone: true }),
  content_end_date: timestamp('content_end_date', { withTimezone: true }),

  // User ownership (null for legacy/system episodes)
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),

  // Processing stage tracking
  current_stage: text('current_stage'),
  processing_started_at: timestamp('processing_started_at', { withTimezone: true }),
  last_stage_update: timestamp('last_stage_update', { withTimezone: true }),
  stage_history: jsonb('stage_history').$type<Array<{
    stage: string;
    status: string;
    timestamp: string;
    duration_ms?: number;
  }>>()
}); 