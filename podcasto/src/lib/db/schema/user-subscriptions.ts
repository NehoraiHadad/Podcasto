import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * User subscription plans
 * Manages monthly subscription plans with recurring credits
 */
export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),

    // Subscription details
    plan_type: text('plan_type').notNull(), // 'basic' | 'pro' | 'enterprise'
    status: text('status').notNull().default('active'), // 'active' | 'cancelled' | 'expired'
    monthly_credits: numeric('monthly_credits').notNull(),

    // Billing cycle
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    current_period_start: timestamp('current_period_start', { withTimezone: true }).notNull(),
    current_period_end: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelled_at: timestamp('cancelled_at', { withTimezone: true }),

    // Payment integration (for future Stripe integration)
    stripe_subscription_id: text('stripe_subscription_id'),
    stripe_customer_id: text('stripe_customer_id'),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index('user_subscriptions_user_idx').on(table.user_id),
    statusIdx: index('user_subscriptions_status_idx').on(table.status),
    periodEndIdx: index('user_subscriptions_period_end_idx').on(table.current_period_end),
    stripeSubIdx: index('user_subscriptions_stripe_sub_idx').on(table.stripe_subscription_id)
  })
);
