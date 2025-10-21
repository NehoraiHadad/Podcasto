import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Dynamic pricing configuration
 * Stores unit costs for different services and regions
 * Supports historical pricing by using effective_from/effective_to dates
 */
export const costPricingConfig = pgTable(
  'cost_pricing_config',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Service identification
    service: text('service').notNull(), // 'gemini_text', 'gemini_image', 'gemini_tts', 's3_put', 's3_get', 'lambda_audio', 'ses', etc.
    region: text('region'), // 'us-east-1', 'us-west-2', etc. (nullable for global services)

    // Pricing details
    unit_cost_usd: numeric('unit_cost_usd').notNull(),
    unit: text('unit').notNull(), // 'tokens', 'requests', 'gb', 'mb', 'emails', 'gb_seconds'

    // Effective date range
    effective_from: timestamp('effective_from', { withTimezone: true }).notNull(),
    effective_to: timestamp('effective_to', { withTimezone: true }), // null means currently active

    // Additional information
    notes: text('notes'), // Provider pricing URL, pricing tier, volume discounts, etc.

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    serviceIdx: index('cost_pricing_config_service_idx').on(table.service),
    effectiveFromIdx: index('cost_pricing_config_effective_from_idx').on(table.effective_from),
    effectiveToIdx: index('cost_pricing_config_effective_to_idx').on(table.effective_to)
  })
);
