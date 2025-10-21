import { pgTable, uuid, numeric, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { episodes } from './episodes';
import { podcasts } from './podcasts';

/**
 * Credit transaction history
 * Records all credit additions and deductions
 */
export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),

    // Transaction details
    amount: numeric('amount').notNull(), // Positive for addition, negative for deduction
    transaction_type: text('transaction_type').notNull(), // 'purchase' | 'usage' | 'bonus' | 'refund' | 'subscription'
    balance_after: numeric('balance_after').notNull(),

    // Related entities (optional)
    episode_id: uuid('episode_id').references(() => episodes.id, { onDelete: 'set null' }),
    podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'set null' }),

    // Metadata
    description: text('description'),
    metadata: jsonb('metadata').$type<{
      package_id?: string;
      subscription_id?: string;
      price_usd?: number;
      [key: string]: unknown;
    }>(),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index('credit_transactions_user_idx').on(table.user_id),
    typeIdx: index('credit_transactions_type_idx').on(table.transaction_type),
    episodeIdx: index('credit_transactions_episode_idx').on(table.episode_id),
    podcastIdx: index('credit_transactions_podcast_idx').on(table.podcast_id),
    createdAtIdx: index('credit_transactions_created_at_idx').on(table.created_at)
  })
);
