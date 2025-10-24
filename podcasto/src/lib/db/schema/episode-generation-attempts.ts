import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { podcasts } from './podcasts';
import { episodes } from './episodes';
import { profiles } from './profiles';

/**
 * Tracks every attempt to generate an episode (successful or failed)
 * Provides historical data for reporting, monitoring, and trend analysis
 */
export const episodeGenerationAttempts = pgTable('episode_generation_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Foreign keys
  podcast_id: uuid('podcast_id')
    .references(() => podcasts.id, { onDelete: 'cascade' })
    .notNull(),

  episode_id: uuid('episode_id')
    .references(() => episodes.id, { onDelete: 'set null' }),
    // null when attempt failed before episode creation

  triggered_by: uuid('triggered_by')
    .references(() => profiles.id, { onDelete: 'set null' }),
    // null for CRON/system triggers

  // Attempt outcome
  status: text('status').notNull(),
  // Enum values: 'success' | 'failed_no_messages' | 'failed_insufficient_credits' | 'failed_error'

  // Trigger context
  trigger_source: text('trigger_source').notNull(),
  // Enum values: 'cron' | 'manual_admin' | 'manual_user' | 'api'

  // Date range used for content collection
  content_start_date: timestamp('content_start_date', { withTimezone: true }),
  content_end_date: timestamp('content_end_date', { withTimezone: true }),

  // Error/failure details
  failure_reason: text('failure_reason'),
  // Human-readable explanation

  error_details: jsonb('error_details').$type<{
    error_type?: string;
    error_message?: string;
    channel_name?: string;
    latest_message_date?: string;
    credits_required?: number;
    credits_available?: number;
    stack_trace?: string;
  }>(),

  // Notification tracking
  notification_sent: boolean('notification_sent').default(false),
  notification_sent_at: timestamp('notification_sent_at', { withTimezone: true }),

  // Timestamps
  attempted_at: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
