/**
 * Type definitions for podcast generation operations.
 */

import { ActionResponse } from '../schemas';

/**
 * Interface for date range selection
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Interface for the result of podcast generation
 */
export interface GenerationResult extends ActionResponse {
  message?: string;
  timestamp?: string;
  episodeId?: string;
}

/**
 * Interface for Lambda invocation parameters
 */
export interface LambdaInvocationParams {
  podcastId: string;
  episodeId: string;
  podcastConfig: Record<string, unknown>;
  timestamp: string;
  dateRange?: DateRange;
}

/**
 * Interface for config fetch result
 */
export interface ConfigFetchResult extends ActionResponse {
  config?: Record<string, unknown>;
}

/**
 * Interface for episode creation result
 */
export interface EpisodeCreationResult extends ActionResponse {
  episodeId?: string;
}
