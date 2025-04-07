'use server';

import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '../auth-actions';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { revalidateEpisodePaths } from '@/lib/utils/revalidation-utils';

/**
 * Deletes an episode
 * This is a server action that requires admin permissions
 */
export async function deleteEpisode(episodeId: string): Promise<boolean> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Get the episode first to get the podcast_id
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      console.error('Episode not found:', episodeId);
      return false;
    }
    
    // Delete the episode from the database
    const success = await episodesApi.deleteEpisode(episodeId);
    
    if (success && episode.podcast_id) {
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
          
          // Delete episode folder from S3
          const deleteResult = await storageUtils.deleteEpisodeFromS3(
            episode.podcast_id,
            episodeId
          );
          
          if (deleteResult.success) {
            console.log(`Successfully deleted episode ${episodeId} from S3, ${deleteResult.deletedCount} objects removed`);
          } else {
            console.error(`Failed to delete S3 files for episode ${episodeId}:`, deleteResult.error);
          }
        } else {
          console.warn('Missing S3 configuration, skipping S3 deletion');
        }
      } catch (s3Error) {
        // Log S3 deletion error but don't fail the overall operation
        console.error('Error deleting episode files from S3:', s3Error);
      }
      
      // Revalidate paths
      revalidateEpisodePaths(episodeId, episode.podcast_id);
    }
    
    return success;
  } catch (error) {
    logError('deleteEpisode', error);
    throw new Error(`Failed to delete episode: ${errorToString(error)}`);
  }
}

/**
 * Updates an episode's details
 * This is a server action that requires admin permissions
 */
export async function updateEpisodeDetails(
  episodeId: string,
  data: {
    title?: string;
    description?: string;
    language?: string;
    status?: string;
  }
): Promise<Awaited<ReturnType<typeof episodesApi.updateEpisode>>> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Update the episode
    const updatedEpisode = await episodesApi.updateEpisode(episodeId, data);
    
    if (updatedEpisode) {
      // Revalidate paths
      revalidateEpisodePaths(episodeId, updatedEpisode.podcast_id);
    }
    
    return updatedEpisode;
  } catch (error) {
    logError('updateEpisodeDetails', error);
    throw new Error(`Failed to update episode: ${errorToString(error)}`);
  }
} 