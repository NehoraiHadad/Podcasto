import { S3Client, PutObjectCommand, DeleteObjectsCommand, DeleteObjectsCommandOutput, ListObjectsV2Command, _Object } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { TranscriptFileUtils, createTranscriptFileUtils } from './transcript-utils';
import { buildS3Url } from '@/lib/utils/s3-url-utils';
import { buildEpisodeImagePath, buildEpisodeFolderPrefix, buildPodcastFolderPrefix } from '@/lib/utils/s3-path-utils';

/**
 * Configuration for S3 storage operations
 */
export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Detailed result for S3 deletion operations
 */
export interface DetailedDeleteResult {
  success: boolean;
  deletedCount: number;
  failedKeys?: string[];
  warnings?: string[];
  error?: string;
}

/**
 * Utilities for handling S3 storage operations
 */
export class S3StorageUtils {
  private s3Client: S3Client;
  private s3Bucket: string;
  private s3Region: string;
  private transcriptUtils: TranscriptFileUtils;

  /**
   * Initialize S3 storage utilities
   */
  constructor(config: S3StorageConfig) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    
    this.s3Bucket = config.bucket;
    this.s3Region = config.region;
    
    // Initialize transcript utilities
    this.transcriptUtils = createTranscriptFileUtils(this.s3Client, this.s3Bucket);
  }

  /**
   * Get transcript file from S3
   */
  async getTranscriptFromS3(podcastId: string, episodeId: string): Promise<string | null> {
    return this.transcriptUtils.getTranscriptsFromS3(podcastId, episodeId);
  }

  /**
   * Upload episode image to S3
   */
  async uploadImageToS3(
    podcastId: string,
    episodeId: string,
    imageData: Buffer,
    mimeType: string
  ): Promise<string> {
    // Generate a unique filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `cover-${randomUUID()}.${extension}`;

    // Construct the image path using utility
    const imageKey = buildEpisodeImagePath(podcastId, episodeId, filename);

    // Upload the image
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: imageKey,
      Body: imageData,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    // Return the public URL using the utility function
    return await buildS3Url({
      bucket: this.s3Bucket,
      region: this.s3Region,
      key: imageKey
    });
  }

  /**
   * List all objects with a specific prefix (supports pagination for >1000 objects)
   */
  private async listAllObjectsWithPrefix(prefix: string): Promise<_Object[]> {
    const allObjects: _Object[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });

      const response = await this.s3Client.send(command);

      if (response.Contents) {
        allObjects.push(...response.Contents);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return allObjects;
  }

  /**
   * Delete objects in batches (up to 1000 per batch as per AWS limit)
   */
  private async deleteBatch(keys: string[]): Promise<{
    deletedCount: number;
    failedKeys: string[];
  }> {
    if (keys.length === 0) {
      return { deletedCount: 0, failedKeys: [] };
    }

    const failedKeys: string[] = [];
    let deletedCount = 0;

    // Split into batches of 1000 (AWS limit)
    const batchSize = 1000;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      try {
        const command = new DeleteObjectsCommand({
          Bucket: this.s3Bucket,
          Delete: {
            Objects: batch.map(key => ({ Key: key })),
            Quiet: false  // Get detailed error information
          }
        });

        const result = await this.deleteWithRetry(command);

        // Count successful deletions
        if (result.Deleted) {
          deletedCount += result.Deleted.length;
        }

        // Collect failed deletions
        if (result.Errors) {
          failedKeys.push(...result.Errors.map(e => e.Key || 'unknown'));
          console.error('[S3_STORAGE] Batch deletion errors:', result.Errors);
        }
      } catch (error) {
        console.error('[S3_STORAGE] Batch deletion failed:', error);
        // If entire batch fails, add all keys to failed list
        failedKeys.push(...batch);
      }
    }

    return { deletedCount, failedKeys };
  }

  /**
   * Execute S3 command with retry logic and exponential backoff
   */
  private async deleteWithRetry(command: DeleteObjectsCommand, maxRetries = 3): Promise<DeleteObjectsCommandOutput> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.s3Client.send(command);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`[S3_STORAGE] Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError || new Error('Unknown error in deleteWithRetry');
  }

  /**
   * Delete episode folder from S3
   */
  async deleteEpisodeFromS3(podcastId: string, episodeId: string): Promise<DetailedDeleteResult> {
    try {
      // Construct the folder prefix using utility
      const prefix = buildEpisodeFolderPrefix(podcastId, episodeId);

      // List all objects with the episode prefix (supports >1000 objects)
      const objects = await this.listAllObjectsWithPrefix(prefix);

      if (!objects || objects.length === 0) {
        console.log(`[S3_STORAGE] No objects found for episode ${episodeId}`);
        return { success: true, deletedCount: 0 };
      }

      // Extract keys from objects
      const keys = objects.map(obj => obj.Key!).filter(key => key);

      console.log(`[S3_STORAGE] Deleting ${keys.length} objects for episode ${episodeId}`);

      // Delete all objects in batches
      const { deletedCount, failedKeys } = await this.deleteBatch(keys);

      const warnings: string[] = [];
      if (failedKeys.length > 0) {
        warnings.push(`Failed to delete ${failedKeys.length} out of ${keys.length} files`);
      }

      console.log(`[S3_STORAGE] Successfully deleted ${deletedCount} objects for episode ${episodeId}`);

      return {
        success: failedKeys.length === 0,
        deletedCount,
        failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error(`[S3_STORAGE] Error deleting episode ${episodeId} from S3:`, error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Delete podcast folder from S3
   */
  async deletePodcastFromS3(podcastId: string): Promise<DetailedDeleteResult> {
    try {
      // Construct the folder prefix using utility
      const prefix = buildPodcastFolderPrefix(podcastId);

      // List all objects with the podcast prefix (supports >1000 objects)
      const objects = await this.listAllObjectsWithPrefix(prefix);

      if (!objects || objects.length === 0) {
        console.log(`[S3_STORAGE] No objects found for podcast ${podcastId}`);
        return { success: true, deletedCount: 0 };
      }

      // Extract keys from objects
      const keys = objects.map(obj => obj.Key!).filter(key => key);

      console.log(`[S3_STORAGE] Deleting ${keys.length} objects for podcast ${podcastId}`);

      // Delete all objects in batches
      const { deletedCount, failedKeys } = await this.deleteBatch(keys);

      const warnings: string[] = [];
      if (failedKeys.length > 0) {
        warnings.push(`Failed to delete ${failedKeys.length} out of ${keys.length} files`);
      }

      console.log(`[S3_STORAGE] Successfully deleted ${deletedCount} objects for podcast ${podcastId}`);

      return {
        success: failedKeys.length === 0,
        deletedCount,
        failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error(`[S3_STORAGE] Error deleting podcast ${podcastId} from S3:`, error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
}

/**
 * Create S3 storage utilities with the specified configuration
 */
export function createS3StorageUtils(config: S3StorageConfig): S3StorageUtils {
  return new S3StorageUtils(config);
} 