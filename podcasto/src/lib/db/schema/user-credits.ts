import { pgTable, uuid, numeric, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * User credits balance and tracking
 * Stores the total credits available for each user
 */
export const userCredits = pgTable(
  'user_credits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),

    // Credit balances
    total_credits: numeric('total_credits').notNull().default('0'),
    used_credits: numeric('used_credits').notNull().default('0'),
    available_credits: numeric('available_credits').notNull().default('0'),
    free_credits: numeric('free_credits').notNull().default('0'),

    // Tracking timestamps
    last_purchase_at: timestamp('last_purchase_at', { withTimezone: true }),
    credits_expire_at: timestamp('credits_expire_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userUnique: unique('user_credits_user_unique').on(table.user_id),
    userIdx: index('user_credits_user_idx').on(table.user_id),
    availableCreditsIdx: index('user_credits_available_idx').on(table.available_credits)
  })
);
