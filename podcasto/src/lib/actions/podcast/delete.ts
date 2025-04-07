'use server';

import { podcastsApi } from '@/lib/db/api';
import { ActionResponse } from './schemas';
import { requireAdmin } from './auth';
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
        } else {
          console.error(`Failed to delete S3 files for podcast ${id}:`, deleteResult.error);
        }
      } else {
        console.warn('Missing S3 configuration, skipping S3 deletion');
      }
    } catch (s3Error) {
      // Log S3 deletion error but don't fail the overall operation
      console.error('Error deleting podcast files from S3:', s3Error);
    }
    
    // Revalidate cached paths
    revalidatePodcastPaths();
    
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
} 