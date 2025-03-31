import { pgTable, uuid, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';

export const episodes = pgTable('episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language'),
  audio_url: varchar('audio_url').notNull(),
  duration: integer('duration'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  published_at: timestamp('published_at', { withTimezone: true }),
  status: text('status'),
  metadata: text('metadata'),
  cover_image: text('cover_image')
}); 