/**
 * SES Rate Limiter
 * Implements token bucket algorithm to respect AWS SES sending limits
 *
 * AWS SES Limits:
 * - Sandbox: 1 email/second, 200 emails/day
 * - Production: 14 emails/second, 50,000 emails/day
 */

export interface RateLimiterConfig {
  /** Maximum emails per second (1 for sandbox, 14 for production) */
  maxEmailsPerSecond: number;
  /** Maximum emails per day (200 for sandbox, 50000 for production) */
  maxEmailsPerDay: number;
  /** Whether to enable detailed logging */
  enableLogging?: boolean;
}

export class SESRateLimiter {
  private readonly config: RateLimiterConfig;
  private lastSendTime: number = 0;
  private emailsSentToday: number = 0;
  private dayStartTime: number = Date.now();
  private readonly delayMs: number;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    // Calculate delay between emails to respect rate limit
    // Add 10ms buffer to ensure we don't exceed limit
    this.delayMs = Math.ceil(1000 / config.maxEmailsPerSecond) + 10;

    if (this.config.enableLogging) {
      console.log('[SES_RATE_LIMITER] Initialized with config:', {
        maxEmailsPerSecond: config.maxEmailsPerSecond,
        maxEmailsPerDay: config.maxEmailsPerDay,
        delayMs: this.delayMs
      });
    }
  }

  /**
   * Creates a rate limiter with default AWS SES sandbox limits
   */
  static createSandboxLimiter(enableLogging = false): SESRateLimiter {
    return new SESRateLimiter({
      maxEmailsPerSecond: 1,
      maxEmailsPerDay: 200,
      enableLogging
    });
  }

  /**
   * Creates a rate limiter with AWS SES production limits
   */
  static createProductionLimiter(enableLogging = false): SESRateLimiter {
    return new SESRateLimiter({
      maxEmailsPerSecond: 14,
      maxEmailsPerDay: 50000,
      enableLogging
    });
  }

  /**
   * Auto-detects SES mode from environment and creates appropriate limiter
   */
  static createFromEnvironment(): SESRateLimiter {
    const isSandbox = process.env.AWS_SES_SANDBOX === 'true';
    const enableLogging = process.env.NODE_ENV === 'development';

    if (isSandbox) {
      console.log('[SES_RATE_LIMITER] Running in SANDBOX mode (1 email/sec, 200/day)');
      return SESRateLimiter.createSandboxLimiter(enableLogging);
    } else {
      console.log('[SES_RATE_LIMITER] Running in PRODUCTION mode (14 emails/sec, 50k/day)');
      return SESRateLimiter.createProductionLimiter(enableLogging);
    }
  }

  /**
   * Waits if necessary to respect rate limits, then records the send
   * @throws Error if daily limit would be exceeded
   */
  async waitForRateLimit(): Promise<void> {
    // Check daily limit
    const now = Date.now();
    const millisInDay = 24 * 60 * 60 * 1000;

    // Reset counter if a new day has started
    if (now - this.dayStartTime > millisInDay) {
      if (this.config.enableLogging) {
        console.log('[SES_RATE_LIMITER] New day started, resetting daily counter');
      }
      this.emailsSentToday = 0;
      this.dayStartTime = now;
    }

    // Check if we would exceed daily limit
    if (this.emailsSentToday >= this.config.maxEmailsPerDay) {
      const resetTime = new Date(this.dayStartTime + millisInDay);
      throw new Error(
        `Daily SES limit reached (${this.config.maxEmailsPerDay} emails). ` +
        `Limit will reset at ${resetTime.toISOString()}`
      );
    }

    // Calculate how long to wait to respect per-second rate limit
    const timeSinceLastSend = now - this.lastSendTime;
    const timeToWait = Math.max(0, this.delayMs - timeSinceLastSend);

    if (timeToWait > 0) {
      if (this.config.enableLogging) {
        console.log(`[SES_RATE_LIMITER] Waiting ${timeToWait}ms to respect rate limit`);
      }
      await this.sleep(timeToWait);
    }

    // Record this send
    this.lastSendTime = Date.now();
    this.emailsSentToday++;

    if (this.config.enableLogging) {
      console.log(`[SES_RATE_LIMITER] Email ${this.emailsSentToday}/${this.config.maxEmailsPerDay} sent today`);
    }
  }

  /**
   * Waits if necessary to respect rate limits for bulk sending
   * Records multiple emails sent in a single batch operation
   * @param batchSize - Number of emails being sent in this batch
   * @throws Error if daily limit would be exceeded
   */
  async waitForBatch(batchSize: number): Promise<void> {
    if (batchSize <= 0) {
      throw new Error('Batch size must be greater than 0');
    }

    if (batchSize > 50) {
      throw new Error('SES bulk send supports maximum 50 recipients per batch');
    }

    // Check daily limit
    const now = Date.now();
    const millisInDay = 24 * 60 * 60 * 1000;

    // Reset counter if a new day has started
    if (now - this.dayStartTime > millisInDay) {
      if (this.config.enableLogging) {
        console.log('[SES_RATE_LIMITER] New day started, resetting daily counter');
      }
      this.emailsSentToday = 0;
      this.dayStartTime = now;
    }

    // Check if we would exceed daily limit with this batch
    if (this.emailsSentToday + batchSize > this.config.maxEmailsPerDay) {
      const resetTime = new Date(this.dayStartTime + millisInDay);
      throw new Error(
        `Daily SES limit would be exceeded by this batch ` +
        `(current: ${this.emailsSentToday}, batch: ${batchSize}, limit: ${this.config.maxEmailsPerDay}). ` +
        `Limit will reset at ${resetTime.toISOString()}`
      );
    }

    // For bulk sending, AWS SES handles internal rate limiting
    // We only need minimal delay to avoid overwhelming the API
    // Calculate delay based on batch size: larger batches need more time
    const timeSinceLastSend = now - this.lastSendTime;
    const batchDelayMs = Math.ceil((this.delayMs * batchSize) / 10); // 10% of individual delays
    const timeToWait = Math.max(0, batchDelayMs - timeSinceLastSend);

    if (timeToWait > 0) {
      if (this.config.enableLogging) {
        console.log(`[SES_RATE_LIMITER] Waiting ${timeToWait}ms before sending batch of ${batchSize}`);
      }
      await this.sleep(timeToWait);
    }

    // Record this batch
    this.lastSendTime = Date.now();
    this.emailsSentToday += batchSize;

    if (this.config.enableLogging) {
      console.log(
        `[SES_RATE_LIMITER] Batch of ${batchSize} sent. ` +
        `Total today: ${this.emailsSentToday}/${this.config.maxEmailsPerDay}`
      );
    }
  }

  /**
   * Returns current rate limiter statistics
   */
  getStats() {
    return {
      emailsSentToday: this.emailsSentToday,
      maxEmailsPerDay: this.config.maxEmailsPerDay,
      remainingToday: this.config.maxEmailsPerDay - this.emailsSentToday,
      maxEmailsPerSecond: this.config.maxEmailsPerSecond,
      delayBetweenEmails: this.delayMs
    };
  }

  /**
   * Resets the rate limiter (useful for testing)
   */
  reset(): void {
    this.lastSendTime = 0;
    this.emailsSentToday = 0;
    this.dayStartTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
