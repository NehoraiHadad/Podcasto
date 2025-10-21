import {
  S3Client,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  ListObjectsV2Command,
  _Object
} from '@aws-sdk/client-s3';
import {
  buildEpisodeFolderPrefix,
  buildPodcastFolderPrefix
} from '@/lib/utils/s3-path-utils';
import type { DetailedDeleteResult } from './s3-service-types';
import { trackCostEventBatch } from './cost-tracker';

/**
 * Bulk operations for S3Service
 */
export class S3BulkOperations {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(s3Client: S3Client, bucketName: string, region?: string) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
    this.region = region || process.env.AWS_REGION || 'us-east-1';
  }

  async listAllObjectsWithPrefix(prefix: string): Promise<_Object[]> {
    const allObjects: _Object[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });

      const response = await this.s3Client.send(command);
      if (response.Contents) allObjects.push(...response.Contents);
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return allObjects;
  }

  async deleteBatch(keys: string[]): Promise<{ deletedCount: number; failedKeys: string[] }> {
    if (keys.length === 0) return { deletedCount: 0, failedKeys: [] };

    const failedKeys: string[] = [];
    let deletedCount = 0;

    const batchSize = 1000;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      try {
        const command = new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: batch.map(key => ({ Key: key })),
            Quiet: false
          }
        });

        const result = await this.deleteWithRetry(command);

        if (result.Deleted) deletedCount += result.Deleted.length;

        if (result.Errors) {
          failedKeys.push(...result.Errors.map(e => e.Key || 'unknown'));
          console.error('[S3_BULK_OPS] Batch deletion errors:', result.Errors);
        }
      } catch (error) {
        console.error('[S3_BULK_OPS] Batch deletion failed:', error);
        failedKeys.push(...batch);
      }
    }

    return { deletedCount, failedKeys };
  }

  private async deleteWithRetry(command: DeleteObjectsCommand, maxRetries = 3): Promise<DeleteObjectsCommandOutput> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.s3Client.send(command);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === maxRetries - 1) break;

        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`[S3_BULK_OPS] Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError || new Error('Unknown error in deleteWithRetry');
  }

  async deleteAllEpisodeFiles(podcastId: string, episodeId: string): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      const prefix = buildEpisodeFolderPrefix(podcastId, episodeId);
      const objects = await this.listAllObjectsWithPrefix(prefix);

      if (objects.length === 0) return { success: true, deletedCount: 0 };

      const keys = objects.map(obj => obj.Key!).filter(key => key);
      const { deletedCount, failedKeys } = await this.deleteBatch(keys);

      // Track S3 DELETE costs in batch (only for successfully deleted files)
      if (deletedCount > 0) {
        try {
          const costEvents = keys
            .filter(key => !failedKeys.includes(key))
            .map(key => ({
              episodeId,
              podcastId,
              eventType: 's3_operation' as const,
              service: 's3_delete' as const,
              quantity: 1,
              unit: 'requests' as const,
              metadata: {
                operation: 'DELETE',
                s3_key: key,
                region: this.region
              }
            }));

          await trackCostEventBatch({ events: costEvents });
        } catch (costError) {
          console.error('[S3_BULK_OPS] Cost tracking failed for bulk S3 DELETE:', costError);
        }
      }

      if (failedKeys.length > 0) {
        return {
          success: false,
          deletedCount,
          error: `Failed to delete ${failedKeys.length} files: ${failedKeys.join(', ')}`
        };
      }

      console.log(`[S3_BULK_OPS] Successfully deleted ${deletedCount} files for episode ${episodeId}`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('[S3_BULK_OPS] Error during batch deletion:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Batch deletion failed'
      };
    }
  }

  async deleteEpisodeFromS3(podcastId: string, episodeId: string): Promise<DetailedDeleteResult> {
    try {
      const prefix = buildEpisodeFolderPrefix(podcastId, episodeId);
      const objects = await this.listAllObjectsWithPrefix(prefix);

      if (!objects || objects.length === 0) {
        console.log(`[S3_BULK_OPS] No objects found for episode ${episodeId}`);
        return { success: true, deletedCount: 0 };
      }

      const keys = objects.map(obj => obj.Key!).filter(key => key);
      console.log(`[S3_BULK_OPS] Deleting ${keys.length} objects for episode ${episodeId}`);

      const { deletedCount, failedKeys } = await this.deleteBatch(keys);

      const warnings: string[] = [];
      if (failedKeys.length > 0) {
        warnings.push(`Failed to delete ${failedKeys.length} out of ${keys.length} files`);
      }

      console.log(`[S3_BULK_OPS] Successfully deleted ${deletedCount} objects for episode ${episodeId}`);

      return {
        success: failedKeys.length === 0,
        deletedCount,
        failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error(`[S3_BULK_OPS] Error deleting episode ${episodeId} from S3:`, error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async deletePodcastFromS3(podcastId: string): Promise<DetailedDeleteResult> {
    try {
      const prefix = buildPodcastFolderPrefix(podcastId);
      const objects = await this.listAllObjectsWithPrefix(prefix);

      if (!objects || objects.length === 0) {
        console.log(`[S3_BULK_OPS] No objects found for podcast ${podcastId}`);
        return { success: true, deletedCount: 0 };
      }

      const keys = objects.map(obj => obj.Key!).filter(key => key);
      console.log(`[S3_BULK_OPS] Deleting ${keys.length} objects for podcast ${podcastId}`);

      const { deletedCount, failedKeys } = await this.deleteBatch(keys);

      const warnings: string[] = [];
      if (failedKeys.length > 0) {
        warnings.push(`Failed to delete ${failedKeys.length} out of ${keys.length} files`);
      }

      console.log(`[S3_BULK_OPS] Successfully deleted ${deletedCount} objects for podcast ${podcastId}`);

      return {
        success: failedKeys.length === 0,
        deletedCount,
        failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error(`[S3_BULK_OPS] Error deleting podcast ${podcastId} from S3:`, error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
