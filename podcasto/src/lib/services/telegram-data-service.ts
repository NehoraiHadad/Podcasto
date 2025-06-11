import { GetObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client } from '@/lib/utils/s3-utils';

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

export class TelegramDataService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    
    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }
  }

  /**
   * Retrieves Telegram data from S3 for a specific episode
   */
  async getTelegramData(
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
      
      // Try alternative paths if primary fails
      if (!customPath) {
        return await this.tryAlternativePaths(podcastId, episodeId);
      }
      
      return null;
    }
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