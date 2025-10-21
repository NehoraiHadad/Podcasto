import { pgTable, uuid, integer, numeric, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';

/**
 * Monthly cost aggregations
 * Provides monthly rollup of costs with podcast-level breakdowns
 */
export const monthlyCostSummary = pgTable(
  'monthly_cost_summary',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12

    // Activity metrics
    total_episodes: integer('total_episodes').notNull().default(0),
    total_podcasts_active: integer('total_podcasts_active').notNull().default(0),

    // Cost breakdown
    total_cost_usd: numeric('total_cost_usd').notNull().default('0'),
    ai_total_usd: numeric('ai_total_usd').notNull().default('0'),
    lambda_total_usd: numeric('lambda_total_usd').notNull().default('0'),
    storage_total_usd: numeric('storage_total_usd').notNull().default('0'),
    email_total_usd: numeric('email_total_usd').notNull().default('0'),
    other_total_usd: numeric('other_total_usd').notNull().default('0'),

    // Podcast-level breakdown
    podcast_costs: jsonb('podcast_costs').$type<Array<{
      podcast_id: string;
      episode_count: number;
      total_cost_usd: number;
    }>>(),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    yearMonthUnique: unique('monthly_cost_summary_year_month_unique').on(table.year, table.month)
  })
);
