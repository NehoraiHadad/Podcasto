import { pgTable, uuid, numeric, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * Aggregated costs per user
 * Provides quick access to total costs and breakdowns for each user
 * Updated periodically by aggregating cost_tracking_events
 */
export const userCosts = pgTable(
  'user_costs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),

    // Cost breakdown by service category
    ai_text_cost_usd: numeric('ai_text_cost_usd').notNull().default('0'),
    ai_image_cost_usd: numeric('ai_image_cost_usd').notNull().default('0'),
    ai_tts_cost_usd: numeric('ai_tts_cost_usd').notNull().default('0'),
    lambda_execution_cost_usd: numeric('lambda_execution_cost_usd').notNull().default('0'),
    s3_operations_cost_usd: numeric('s3_operations_cost_usd').notNull().default('0'),
    s3_storage_cost_usd: numeric('s3_storage_cost_usd').notNull().default('0'),
    email_cost_usd: numeric('email_cost_usd').notNull().default('0'),
    sqs_cost_usd: numeric('sqs_cost_usd').notNull().default('0'),
    other_cost_usd: numeric('other_cost_usd').notNull().default('0'),
    total_cost_usd: numeric('total_cost_usd').notNull().default('0'),

    // Usage metrics
    total_tokens: integer('total_tokens').notNull().default(0),
    total_emails_sent: integer('total_emails_sent').notNull().default(0),
    total_s3_operations: integer('total_s3_operations').notNull().default(0),
    storage_mb: numeric('storage_mb').notNull().default('0'),
    lambda_duration_seconds: numeric('lambda_duration_seconds').notNull().default('0'),

    // Tracking timestamps
    cost_calculated_at: timestamp('cost_calculated_at', { withTimezone: true }),
    last_updated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userUnique: unique('user_costs_user_unique').on(table.user_id),
    userIdx: index('user_costs_user_idx').on(table.user_id),
    totalCostIdx: index('user_costs_total_cost_idx').on(table.total_cost_usd)
  })
);
