/**
 * Telegram Service Interfaces
 * Type-safe contracts for Telegram content retrieval
 */

/**
 * Telegram message structure
 */
export interface TelegramMessage {
  text?: string;
  urls?: string[];
  media_description?: string;
  timestamp?: string;
}

/**
 * Telegram data structure from S3
 */
export interface TelegramData {
  results?: {
    [channel: string]: TelegramMessage[];
  };
  total_messages?: number;
}

/**
 * Retry configuration for Telegram data fetching
 */
export interface TelegramRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Telegram Data Service Interface
 * Retrieves Telegram content from S3 with retry mechanism
 */
export interface ITelegramDataService {
  /**
   * Retrieves Telegram data from S3 for a specific episode with retry mechanism
   * Uses exponential backoff to handle transient errors or data not yet available
   * @param podcastId - Podcast identifier
   * @param episodeId - Episode identifier
   * @param customPath - Optional custom S3 path
   * @param enableRetry - Enable retry mechanism (default: true)
   * @returns Telegram data or null if not found
   * @throws Error if all retry attempts are exhausted
   */
  getTelegramData(
    podcastId: string,
    episodeId: string,
    customPath?: string,
    enableRetry?: boolean
  ): Promise<TelegramData | null>;

  /**
   * Validates that Telegram data has required structure
   * Checks for results object and at least one channel with messages
   * @param data - Telegram data to validate
   * @returns True if data is valid
   */
  validateTelegramData(data: TelegramData): boolean;
}
