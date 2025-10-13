'use server';

import { podcastsApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth';
import { ActionResponse } from './schemas';
import { handleActionError, revalidatePodcastPaths } from './utils';

/**
 * Deletes a podcast by ID
 */
export async function deletePodcast(id: string): Promise<ActionResponse> {
  try {
    // Check if the user has admin permissions
    await requireAdmin();
    
    // Delete the podcast
    const success = await podcastsApi.deletePodcast(id);
    
    if (!success) {
      return {
        success: false,
        error: 'Failed to delete podcast',
      };
    }
    
    try {
      // Import storage utility
      const { createS3StorageUtils } = await import('@/lib/services/storage-utils');

      // Get S3 credentials from environment
      const region = process.env.AWS_REGION;
      const bucket = process.env.S3_BUCKET_NAME;
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (region && bucket && accessKeyId && secretAccessKey) {
        // Initialize storage utils
        const storageUtils = createS3StorageUtils({
          region,
          bucket,
          accessKeyId,
          secretAccessKey
        });

        // Delete podcast folder from S3
        const deleteResult = await storageUtils.deletePodcastFromS3(id);

        if (deleteResult.success) {
          console.log(`Successfully deleted podcast ${id} from S3, ${deleteResult.deletedCount} objects removed`);
        } else if (deleteResult.error) {
          // Critical error - inform user
          console.error(`Failed to delete S3 files for podcast ${id}:`, deleteResult.error);
          return {
            success: false,
            error: `Podcast deleted from database, but failed to delete ${deleteResult.failedKeys?.length || 'all'} files from S3: ${deleteResult.error}`
          };
        } else if (deleteResult.failedKeys && deleteResult.failedKeys.length > 0) {
          // Partial failure - inform user
          console.error(`Partial S3 deletion failure for podcast ${id}: ${deleteResult.failedKeys.length} files remain`);
          return {
            success: false,
            error: `Podcast deleted from database, but ${deleteResult.failedKeys.length} files remain in S3. Please contact support.`
          };
        }

        // Check for warnings
        if (deleteResult.warnings && deleteResult.warnings.length > 0) {
          console.warn(`S3 deletion warnings for podcast ${id}:`, deleteResult.warnings);
        }
      } else {
        console.warn('Missing S3 configuration, skipping S3 deletion');
      }
    } catch (s3Error) {
      // Log S3 deletion error but don't fail the overall operation
      console.error('Error deleting podcast files from S3:', s3Error);
      return {
        success: false,
        error: `Podcast deleted from database, but S3 cleanup failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`
      };
    }
    
    // Revalidate cached paths
    revalidatePodcastPaths();
    
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
} 