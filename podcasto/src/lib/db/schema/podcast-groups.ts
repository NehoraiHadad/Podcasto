import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Podcast Groups Table
 *
 * Master entity for podcasts that exist in multiple languages.
 * Example: "Abuali Express" is a podcast group that has Hebrew and English variants.
 */
export const podcastGroups = pgTable('podcast_groups', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Base information (language-agnostic)
  base_title: text('base_title').notNull(),
  base_description: text('base_description'),
  base_cover_image: text('base_cover_image'),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
