import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { episodes } from './episodes';

/**
 * Tracks detailed processing stages for episode generation
 * Provides visibility into where and why episode processing fails
 */
export const episodeProcessingLogs = pgTable('episode_processing_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  episode_id: uuid('episode_id')
    .references(() => episodes.id, { onDelete: 'cascade' })
    .notNull(),

  // Processing stage identifier
  stage: text('stage').notNull(),

  // Stage status: 'started', 'completed', 'failed'
  status: text('status').notNull(),

  // Error information (only for failed stages)
  error_message: text('error_message'),
  error_details: jsonb('error_details').$type<{
    error_type?: string;
    stack_trace?: string;
    context?: Record<string, unknown>;
    retry_count?: number;
  }>(),

  // Additional metadata (Lambda request ID, SQS message ID, etc.)
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Timing information
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  duration_ms: integer('duration_ms'),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
