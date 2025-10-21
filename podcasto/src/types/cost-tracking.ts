/**
 * Type definitions for cost tracking system
 * These types are derived from the Drizzle ORM schema definitions
 */

/**
 * Event types for cost tracking
 */
export type CostEventType =
  | 'ai_api_call'
  | 'lambda_execution'
  | 's3_operation'
  | 'ses_email'
  | 'sqs_message'
  | 'storage_usage';

/**
 * Service identifiers for cost tracking
 */
export type CostService =
  | 'gemini_text'
  | 'gemini_image'
  | 'gemini_tts'
  | 'lambda_audio'
  | 'lambda_telegram'
  | 's3_put'
  | 's3_get'
  | 's3_delete'
  | 's3_storage'
  | 'ses'
  | 'sqs';

/**
 * Unit types for measuring costs
 */
export type CostUnit =
  | 'tokens'
  | 'images'
  | 'mb'
  | 'gb'
  | 'emails'
  | 'requests'
  | 'gb_seconds';

/**
 * Metadata for cost tracking events
 */
export interface CostEventMetadata {
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
}

/**
 * Podcast cost breakdown for monthly summaries
 */
export interface PodcastCostBreakdown {
  podcast_id: string;
  episode_count: number;
  total_cost_usd: number;
}

/**
 * Helper type for creating cost tracking events
 */
export interface CreateCostEventParams {
  episode_id?: string;
  podcast_id?: string;
  event_type: CostEventType;
  service: CostService;
  quantity: number;
  unit: CostUnit;
  unit_cost_usd: number;
  metadata?: CostEventMetadata;
}

/**
 * Episode cost breakdown summary
 */
export interface EpisodeCostBreakdown {
  ai_text_cost_usd: number;
  ai_image_cost_usd: number;
  ai_tts_cost_usd: number;
  lambda_execution_cost_usd: number;
  s3_operations_cost_usd: number;
  s3_storage_cost_usd: number;
  email_cost_usd: number;
  sqs_cost_usd: number;
  other_cost_usd: number;
  total_cost_usd: number;
}

/**
 * Daily cost analytics
 */
export interface DailyCostAnalytics {
  date: string;
  total_episodes_processed: number;
  total_cost_usd: number;
  ai_cost_usd: number;
  lambda_cost_usd: number;
  storage_cost_usd: number;
  email_cost_usd: number;
  other_cost_usd: number;
  avg_cost_per_episode_usd: number;
  max_episode_cost_usd: number;
}

/**
 * Monthly cost analytics
 */
export interface MonthlyCostAnalytics {
  year: number;
  month: number;
  total_episodes: number;
  total_podcasts_active: number;
  total_cost_usd: number;
  ai_total_usd: number;
  lambda_total_usd: number;
  storage_total_usd: number;
  email_total_usd: number;
  other_total_usd: number;
  podcast_costs?: PodcastCostBreakdown[];
}
