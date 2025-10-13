import { GetObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client } from '@/lib/utils/s3-utils';
import type { ITelegramDataService } from './interfaces';

interface TelegramMessage {
  text?: string;
  urls?: string[];
  media_description?: string;
  timestamp?: string;
}

interface TelegramData {
  results?: {
    [channel: string]: TelegramMessage[];
  };
  total_messages?: number;
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Service for retrieving Telegram data from S3
 *
 * This service handles fetching Telegram channel content stored in S3,
 * with built-in retry logic and exponential backoff.
 */
export class TelegramDataService implements ITelegramDataService {
  private bucketName: string;
  private retryConfig: RetryConfig;

  /**
   * Create a TelegramDataService
   *
   * @param bucketName - Optional S3 bucket name (defaults to env var)
   */
  constructor(bucketName?: string) {
    this.bucketName = bucketName || process.env.S3_BUCKET_NAME || '';

    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME must be provided or set in environment');
    }

    // Configuration for exponential backoff retry
    this.retryConfig = {
      maxRetries: 6, // Total attempts = 1 initial + 6 retries = 7 attempts
      initialDelayMs: 10000, // Start with 10 seconds
      maxDelayMs: 300000, // Max 5 minutes between attempts
      backoffMultiplier: 2 // Double the delay each time
    };
  }

  /**
   * Retrieves Telegram data from S3 for a specific episode with retry mechanism
   */
  async getTelegramData(
    podcastId: string,
    episodeId: string,
    customPath?: string,
    enableRetry: boolean = true
  ): Promise<TelegramData | null> {
    if (!enableRetry) {
      return this.fetchTelegramDataOnce(podcastId, episodeId, customPath);
    }

    return this.fetchTelegramDataWithRetry(podcastId, episodeId, customPath);
  }

  /**
   * Fetches Telegram data with exponential backoff retry logic
   */
  private async fetchTelegramDataWithRetry(
    podcastId: string,
    episodeId: string,
    customPath?: string
  ): Promise<TelegramData | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[TELEGRAM_DATA] Attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1} for episode ${episodeId}`);
        
        const data = await this.fetchTelegramDataOnce(podcastId, episodeId, customPath);
        
        if (data) {
          console.log(`[TELEGRAM_DATA] Successfully retrieved data on attempt ${attempt + 1}`);
          return data;
        }

        // If no data but no error, treat as "not ready yet"
        lastError = new Error('Telegram data not yet available');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[TELEGRAM_DATA] Attempt ${attempt + 1} failed: ${lastError.message}`);
      }

      // Don't wait after the last attempt
      if (attempt < this.retryConfig.maxRetries) {
        const delayMs = this.calculateRetryDelay(attempt);
        console.log(`[TELEGRAM_DATA] Waiting ${delayMs / 1000}s before retry...`);
        await this.sleep(delayMs);
      }
    }

    console.error(`[TELEGRAM_DATA] All retry attempts exhausted for episode ${episodeId}`);
    throw lastError || new Error('Failed to retrieve Telegram data after all retries');
  }

  /**
   * Single attempt to fetch Telegram data (original logic)
   */
  private async fetchTelegramDataOnce(
    podcastId: string,
    episodeId: string,
    customPath?: string
  ): Promise<TelegramData | null> {
    try {
      const { client, error } = await createS3Client();
      if (!client || error) {
        console.error(`[TELEGRAM_DATA] Failed to create S3 client: ${error}`);
        return null;
      }

      // Construct S3 key based on convention or custom path
      const s3Key = customPath || this.constructS3Key(podcastId, episodeId);
      
      console.log(`[TELEGRAM_DATA] Fetching data from S3: ${s3Key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });

      const response = await client.send(command);
      
      if (!response.Body) {
        console.warn(`[TELEGRAM_DATA] No data found at ${s3Key}`);
        return null;
      }

      // Convert stream to string
      const bodyString = await this.streamToString(response.Body);
      
      // Parse JSON data
      const telegramData = JSON.parse(bodyString) as TelegramData;
      
      console.log(`[TELEGRAM_DATA] Successfully retrieved data for ${episodeId}`);
      console.log(`[TELEGRAM_DATA] Total messages: ${telegramData.total_messages || 0}`);
      
      return telegramData;

    } catch (error) {
      console.error(`[TELEGRAM_DATA] Error retrieving data:`, error);
      
      // Try alternative paths if primary fails and no custom path was provided
      if (!customPath) {
        return await this.tryAlternativePaths(podcastId, episodeId);
      }
      
      throw error; // Re-throw for retry mechanism
    }
  }

  /**
   * Calculates delay for exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const delay = this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Constructs the S3 key based on podcast and episode IDs
   */
  private constructS3Key(podcastId: string, episodeId: string): string {
    // Primary convention: podcasts/{podcastId}/{episodeId}/content.json (used by Telegram Lambda)
    return `podcasts/${podcastId}/${episodeId}/content.json`;
  }

  /**
   * Tries alternative S3 paths when primary path fails
   */
  private async tryAlternativePaths(
    podcastId: string,
    episodeId: string
  ): Promise<TelegramData | null> {
    
    const alternativePaths = [
      `podcasts/${podcastId}/${episodeId}/telegram_data.json`, // Old naming convention
      `podcasts/${podcastId}/telegram_data.json`, // Podcast-level data
      `telegram/${podcastId}/${episodeId}.json`,   // Alternative structure
      `data/podcasts/${podcastId}/${episodeId}/telegram.json`, // Different prefix
      `telegram_data/${podcastId}_${episodeId}.json` // Flat structure
    ];

    const { client, error: s3Error } = await createS3Client();
    if (!client || s3Error) {
      console.error(`[TELEGRAM_DATA] Failed to create S3 client for alternative paths: ${s3Error}`);
      return null;
    }

    for (const path of alternativePaths) {
      try {
        console.log(`[TELEGRAM_DATA] Trying alternative path: ${path}`);
        
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: path
        });

        const response = await client.send(command);
        
        if (response.Body) {
          const bodyString = await this.streamToString(response.Body);
          const telegramData = JSON.parse(bodyString) as TelegramData;
          
          console.log(`[TELEGRAM_DATA] Found data at alternative path: ${path}`);
          return telegramData;
        }
      } catch {
        // Continue to next path
        console.log(`[TELEGRAM_DATA] Path not found: ${path}`);
      }
    }

    console.warn(`[TELEGRAM_DATA] No data found in any alternative paths for ${episodeId}`);
    return null;
  }

  /**
   * Converts a readable stream to string
   * Using any because AWS SDK stream types are complex and vary between environments
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async streamToString(stream: any): Promise<string> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  /**
   * Validates that Telegram data has required structure
   */
  validateTelegramData(data: TelegramData): boolean {
    if (!data || !data.results) {
      return false;
    }

    // Check if we have at least one channel with messages
    const channels = Object.keys(data.results);
    if (channels.length === 0) {
      return false;
    }

    // Check if at least one channel has messages
    const hasMessages = channels.some(channel => 
      data.results![channel] && data.results![channel].length > 0
    );

    return hasMessages;
  }
}

/**
 * Factory function to create a TelegramDataService instance
 *
 * @param bucketName - Optional S3 bucket name
 * @returns ITelegramDataService interface implementation
 */
export function createTelegramDataService(bucketName?: string): ITelegramDataService {
  return new TelegramDataService(bucketName);
}

/** @deprecated Use createTelegramDataService() factory function instead */
export const telegramDataService = createTelegramDataService(); 