import { pgTable, uuid, date, integer, numeric, timestamp, unique } from 'drizzle-orm/pg-core';
import { episodes } from './episodes';

/**
 * Daily cost aggregations
 * Provides daily rollup of costs across all episodes and services
 */
export const dailyCostSummary = pgTable(
  'daily_cost_summary',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: date('date').notNull(),

    // Episode metrics
    total_episodes_processed: integer('total_episodes_processed').notNull().default(0),

    // Cost breakdown
    total_cost_usd: numeric('total_cost_usd').notNull().default('0'),
    ai_cost_usd: numeric('ai_cost_usd').notNull().default('0'),
    lambda_cost_usd: numeric('lambda_cost_usd').notNull().default('0'),
    storage_cost_usd: numeric('storage_cost_usd').notNull().default('0'),
    email_cost_usd: numeric('email_cost_usd').notNull().default('0'),
    other_cost_usd: numeric('other_cost_usd').notNull().default('0'),

    // Analytics
    avg_cost_per_episode_usd: numeric('avg_cost_per_episode_usd').notNull().default('0'),
    max_episode_cost_usd: numeric('max_episode_cost_usd').notNull().default('0'),
    most_expensive_episode_id: uuid('most_expensive_episode_id')
      .references(() => episodes.id, { onDelete: 'set null' }),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dateUnique: unique('daily_cost_summary_date_unique').on(table.date)
  })
);
