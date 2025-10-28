import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
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

  // Language configuration (ISO 639-1 code)
  // This is the unified language field for the entire application
  language_code: text('language_code').notNull().default('en'), // ISO language code (e.g., 'en', 'he', 'ar')

  migration_status: text('migration_status').default('legacy'), // 'legacy' | 'migrating' | 'migrated'

  // Automatic episode generation scheduling
  // Note: Uses episode_frequency from podcast_configs, this just tracks when to run next
  auto_generation_enabled: boolean('auto_generation_enabled').default(false),
  last_auto_generated_at: timestamp('last_auto_generated_at', { withTimezone: true }),
  next_scheduled_generation: timestamp('next_scheduled_generation', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}); 