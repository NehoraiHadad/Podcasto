import { pgTable, uuid, text, numeric, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Credit packages available for purchase
 * Defines different credit bundles users can buy
 */
export const creditPackages = pgTable(
  'credit_packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Package details
    name: text('name').notNull(), // e.g., "Basic", "Pro", "Enterprise"
    credits_amount: numeric('credits_amount').notNull(),
    price_usd: numeric('price_usd').notNull(),

    // Description and display
    description: text('description'),
    is_active: boolean('is_active').notNull().default(true),
    display_order: integer('display_order').notNull().default(0),

    // Validity
    validity_days: integer('validity_days'), // null = no expiration

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    isActiveIdx: index('credit_packages_is_active_idx').on(table.is_active),
    displayOrderIdx: index('credit_packages_display_order_idx').on(table.display_order)
  })
);
