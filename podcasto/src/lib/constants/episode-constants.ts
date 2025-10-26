/**
 * Episode-related constants
 * Centralized configuration for episode generation and processing
 */

export const EPISODE_CONSTANTS = {
  // Presigned URL expiration (1 hour)
  PRESIGNED_URL_EXPIRY_SECONDS: 3600,

  // Analytics thresholds
  DEFAULT_FAILURE_THRESHOLD: 0.8, // 80%
  DEFAULT_DAYS_BACK: 7,
  DEFAULT_MIN_ATTEMPTS: 3,

  // Query limits
  DEFAULT_ATTEMPT_LIMIT: 50,
  DEFAULT_PROCESSING_LOGS_LIMIT: 50,
  DEFAULT_STUCK_EPISODE_THRESHOLD_MINUTES: 30,
} as const;

/**
 * Helper to get presigned URL expiry in seconds
 */
export function getPresignedUrlExpiry(): number {
  return EPISODE_CONSTANTS.PRESIGNED_URL_EXPIRY_SECONDS;
}
