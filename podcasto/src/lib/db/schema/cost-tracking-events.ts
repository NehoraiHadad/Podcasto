import { pgTable, uuid, text, numeric, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { episodes } from './episodes';
import { podcasts } from './podcasts';

/**
 * Raw event log for all cost-generating operations
 * Tracks individual API calls, Lambda executions, storage operations, etc.
 */
export const costTrackingEvents = pgTable(
  'cost_tracking_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    episode_id: uuid('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
    podcast_id: uuid('podcast_id').references(() => podcasts.id, { onDelete: 'cascade' }),

    // Event classification
    event_type: text('event_type').notNull(), // 'ai_api_call', 'lambda_execution', 's3_operation', 'ses_email', 'sqs_message', 'storage_usage'
    service: text('service').notNull(), // 'gemini_text', 'gemini_image', 'gemini_tts', 'lambda_audio', 'lambda_telegram', 's3_put', 's3_get', 'ses', 'sqs'

    // Cost calculation
    quantity: numeric('quantity').notNull(), // Tokens, MB, emails, requests, etc.
    unit: text('unit').notNull(), // 'tokens', 'mb', 'emails', 'requests', 'gb_seconds'
    unit_cost_usd: numeric('unit_cost_usd').notNull(), // Cost per unit at time of event
    total_cost_usd: numeric('total_cost_usd').notNull(), // Calculated: quantity × unit_cost_usd

    // Flexible metadata for service-specific details
    metadata: jsonb('metadata').$type<{
      model?: string;
      operation?: string;
      region?: string;
      duration_ms?: number;
      retry_count?: number;
      input_tokens?: number;
      output_tokens?: number;
      file_size_mb?: number;
      email_recipients?: number;
      [key: string]: unknown;
    }>(),

    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    episodeIdx: index('cost_tracking_events_episode_idx').on(table.episode_id),
    podcastIdx: index('cost_tracking_events_podcast_idx').on(table.podcast_id),
    timestampIdx: index('cost_tracking_events_timestamp_idx').on(table.timestamp),
    serviceIdx: index('cost_tracking_events_service_idx').on(table.service)
  })
);
