/**
 * Retry configuration constants for various services
 * Extracted from inline magic numbers across the codebase
 */

export const RETRY_CONFIG = {
  /**
   * Telegram data service retry configuration
   */
  TELEGRAM_DATA: {
    maxRetries: 6,
    initialDelayMs: 10_000, // 10 seconds
    maxDelayMs: 300_000, // 5 minutes
    backoffMultiplier: 2,
  },

  /**
   * AI provider (Gemini) retry configuration
   */
  AI_PROVIDER: {
    initialDelayMs: 2_000, // 2 seconds
    maxDelayMs: 20_000, // 20 seconds
    maxRetries: 3,
  },

  /**
   * Telegram scraper timeout configuration
   */
  TELEGRAM_SCRAPER: {
    timeoutMs: 10_000, // 10 seconds
  },

  /**
   * S3 operations retry configuration
   */
  S3_OPERATIONS: {
    maxRetries: 3,
    initialDelayMs: 1_000, // 1 second
    maxDelayMs: 10_000, // 10 seconds
    backoffMultiplier: 2,
  },
} as const;

/**
 * AI model configuration constants
 */
export const AI_CONFIG = {
  GEMINI: {
    maxOutputTokens: 500,
    temperature: 0.7,
  },
} as const;
