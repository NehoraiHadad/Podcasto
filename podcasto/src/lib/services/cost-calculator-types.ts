/**
 * Type definitions for cost calculator service
 */

/**
 * Parameters for calculating episode cost
 */
export interface CalculateEpisodeCostParams {
  episodeId: string;
}

/**
 * Cost breakdown by service category
 */
export interface CostBreakdown {
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
 * Usage metrics for an episode
 */
export interface UsageMetrics {
  total_tokens: number;
  total_emails_sent: number;
  total_s3_operations: number;
  storage_mb: number;
  lambda_duration_seconds: number;
}

/**
 * Result of episode cost calculation
 */
export interface CalculateEpisodeCostResult {
  success: boolean;
  breakdown?: CostBreakdown;
  metrics?: UsageMetrics;
  error?: string;
}

/**
 * Cost tracking event structure (subset of database schema)
 */
export interface CostEvent {
  service: string;
  total_cost_usd: string;
  metadata: { [key: string]: unknown } | null;
}
