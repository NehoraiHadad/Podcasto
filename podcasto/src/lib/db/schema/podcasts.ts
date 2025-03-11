import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const podcasts = pgTable('podcasts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  cover_image: text('cover_image'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}); 