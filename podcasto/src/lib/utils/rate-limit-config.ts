/**
 * Rate Limit Configuration for Gemini API
 *
 * Manages rate limiting configuration based on Gemini API tier
 * and calculates optimal batch sizes for Vercel serverless constraints
 */

/**
 * Default rate limit for Gemini API Free tier (Requests Per Minute)
 */
const DEFAULT_RPM = 10;

/**
 * Maximum safe operation time for a single batch in seconds
 * Vercel serverless functions have a 60s timeout, we use 50s to leave buffer
 */
const SAFE_BATCH_TIME_SECONDS = 50;

/**
 * Maximum episodes per batch regardless of rate limit
 * This prevents single batches from becoming too large
 */
const MAX_EPISODES_PER_BATCH = 50;

/**
 * Get the configured Gemini API rate limit from environment
 * Falls back to Free tier (10 RPM) if not configured
 */
function getConfiguredRPM(): number {
  const configuredRPM = process.env.GEMINI_RATE_LIMIT_RPM;

  if (!configuredRPM) {
    return DEFAULT_RPM;
  }

  const parsed = parseInt(configuredRPM, 10);

  if (isNaN(parsed) || parsed < 1) {
    console.warn(`[RATE_LIMIT] Invalid GEMINI_RATE_LIMIT_RPM: ${configuredRPM}, using default ${DEFAULT_RPM}`);
    return DEFAULT_RPM;
  }

  return parsed;
}

/**
 * Calculate the delay between API requests in milliseconds
 * based on the configured RPM (Requests Per Minute)
 *
 * @returns Delay in milliseconds
 *
 * @example
 * // With RPM=10 (Free tier)
 * getDelayBetweenRequests() // 6000ms (6 seconds)
 *
 * @example
 * // With RPM=60 (Paid tier)
 * getDelayBetweenRequests() // 1000ms (1 second)
 */
export function getDelayBetweenRequests(): number {
  const rpm = getConfiguredRPM();

  // Calculate delay: 60 seconds / RPM * 1000 (convert to ms)
  const delayMs = Math.ceil((60 / rpm) * 1000);

  console.log(`[RATE_LIMIT] RPM: ${rpm}, Delay: ${delayMs}ms`);

  return delayMs;
}

/**
 * Calculate the maximum number of episodes that can be generated
 * in a single batch, considering Vercel timeout constraints
 *
 * @returns Maximum episodes per batch
 *
 * @example
 * // With RPM=10 (6s delay)
 * getMaxBatchSize() // 8 episodes (50s / 6s)
 *
 * @example
 * // With RPM=60 (1s delay)
 * getMaxBatchSize() // 50 episodes (capped at MAX)
 */
export function getMaxBatchSize(): number {
  const rpm = getConfiguredRPM();
  const delaySeconds = 60 / rpm;

  // Calculate how many episodes fit in safe time window
  const calculatedMax = Math.floor(SAFE_BATCH_TIME_SECONDS / delaySeconds);

  // Cap at maximum to prevent overly large batches
  const batchSize = Math.min(calculatedMax, MAX_EPISODES_PER_BATCH);

  console.log(
    `[RATE_LIMIT] RPM: ${rpm}, Delay: ${delaySeconds}s, ` +
    `Calculated: ${calculatedMax}, Capped: ${batchSize}`
  );

  return batchSize;
}

/**
 * Get rate limit configuration summary for display
 */
export function getRateLimitInfo(): {
  rpm: number;
  delayMs: number;
  delaySeconds: number;
  maxBatchSize: number;
  tier: string;
} {
  const rpm = getConfiguredRPM();
  const delayMs = getDelayBetweenRequests();
  const maxBatchSize = getMaxBatchSize();

  let tier: string;
  if (rpm <= 10) {
    tier = 'Free';
  } else if (rpm <= 60) {
    tier = 'Paid Tier 1';
  } else {
    tier = 'Paid Tier 2+';
  }

  return {
    rpm,
    delayMs,
    delaySeconds: delayMs / 1000,
    maxBatchSize,
    tier
  };
}
