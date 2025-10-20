import { pgTable, uuid, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { podcastGroups } from './podcast-groups';
import { podcasts } from './podcasts';

/**
 * Podcast Languages Table
 *
 * Represents language variants of a podcast group.
 * Example: "Abuali Express" group has Hebrew and English language variants.
 * Each variant links to an actual podcast record with its own configuration.
 */
export const podcastLanguages = pgTable('podcast_languages', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Link to podcast group (master entity)
  podcast_group_id: uuid('podcast_group_id')
    .references(() => podcastGroups.id, { onDelete: 'cascade' })
    .notNull(),

  // Language information
  language_code: text('language_code').notNull(), // 'he', 'en', 'ar', etc.

  // Localized content
  title: text('title').notNull(),
  description: text('description'),
  cover_image: text('cover_image'), // Optional language-specific cover

  // Primary language flag
  is_primary: boolean('is_primary').default(false).notNull(),

  // Link to actual podcast record (for backward compatibility and config)
  podcast_id: uuid('podcast_id')
    .references(() => podcasts.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  // Ensure unique language per group
  uniqueLanguagePerGroup: uniqueIndex('podcast_languages_group_language_idx')
    .on(table.podcast_group_id, table.language_code)
}));
