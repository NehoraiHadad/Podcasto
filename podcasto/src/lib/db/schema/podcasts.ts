import { pgTable, uuid, text, timestamp, boolean, integer, time } from 'drizzle-orm/pg-core';
import { podcastGroups } from './podcast-groups';
import { profiles } from './profiles';

export const podcasts = pgTable('podcasts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  cover_image: text('cover_image'),
  image_style: text('image_style'), // Style used for podcast cover (e.g., 'modern-professional')
  is_paused: boolean('is_paused').default(false).notNull(),

  // User ownership (null for legacy/system podcasts)
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),

  // Multilingual podcast group support (nullable for backward compatibility)
  podcast_group_id: uuid('podcast_group_id').references(() => podcastGroups.id, { onDelete: 'set null' }),
  language_code: text('language_code'), // Language for this podcast variant (e.g., 'he', 'en')
  migration_status: text('migration_status').default('legacy'), // 'legacy' | 'migrating' | 'migrated'

  // Automatic episode generation scheduling
  auto_generation_enabled: boolean('auto_generation_enabled').default(false),
  auto_generation_frequency: text('auto_generation_frequency'), // 'daily' | 'weekly' | 'biweekly' | 'monthly'
  auto_generation_day_of_week: integer('auto_generation_day_of_week'), // 0-6 (Sunday-Saturday)
  auto_generation_time: time('auto_generation_time'), // Time of day for generation
  last_auto_generated_at: timestamp('last_auto_generated_at', { withTimezone: true }),
  next_scheduled_generation: timestamp('next_scheduled_generation', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}); 