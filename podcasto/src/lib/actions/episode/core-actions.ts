'use server';

import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth/server';
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
        // Import S3 service factory
        const { createS3Service } = await import('@/lib/services/s3-service');

        // Create S3 service instance (automatically uses environment variables)
        const s3Service = createS3Service();

        // Delete episode folder from S3
        const deleteResult = await s3Service.deleteEpisodeFromS3(
          episode.podcast_id,
          episodeId
        );

        if (deleteResult.success) {
          console.log(`Successfully deleted episode ${episodeId} from S3, ${deleteResult.deletedCount} objects removed`);
        } else if (deleteResult.error) {
          // Critical error - throw to fail the operation
          console.error(`Failed to delete S3 files for episode ${episodeId}:`, deleteResult.error);
          throw new Error(`Episode deleted from database, but failed to delete ${deleteResult.failedKeys?.length || 'all'} files from S3: ${deleteResult.error}`);
        } else if (deleteResult.failedKeys && deleteResult.failedKeys.length > 0) {
          // Partial failure - throw to fail the operation
          console.error(`Partial S3 deletion failure for episode ${episodeId}: ${deleteResult.failedKeys.length} files remain`);
          throw new Error(`Episode deleted from database, but ${deleteResult.failedKeys.length} files remain in S3. Please contact support.`);
        }

        // Check for warnings
        if (deleteResult.warnings && deleteResult.warnings.length > 0) {
          console.warn(`S3 deletion warnings for episode ${episodeId}:`, deleteResult.warnings);
        }
      } catch (s3Error) {
        // Log S3 deletion error and throw to fail the operation
        console.error('Error deleting episode files from S3:', s3Error);
        throw new Error(`Episode deleted from database, but S3 cleanup failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`);
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
    // Get the episode before update to check status change
    const beforeEpisode = await episodesApi.getEpisodeById(episodeId);
    const wasPublished = beforeEpisode?.status === 'published';

    // Update the episode
    const updatedEpisode = await episodesApi.updateEpisode(episodeId, data);

    if (updatedEpisode) {
      // Revalidate paths
      revalidateEpisodePaths(episodeId, updatedEpisode.podcast_id);

      // If status changed to 'published', send email notifications
      if (!wasPublished && data.status === 'published') {
        console.log(`[UPDATE_EPISODE] Status changed to published for episode ${episodeId}, sending email notifications`);

        // Send email notifications (non-blocking, don't fail the update if emails fail)
        try {
          const { sendNewEpisodeNotification } = await import('@/lib/services/email');
          const emailResult = await sendNewEpisodeNotification(episodeId);
          console.log(`[UPDATE_EPISODE] Email notifications sent: ${emailResult.emailsSent}/${emailResult.totalSubscribers}`);
        } catch (emailError) {
          console.error(`[UPDATE_EPISODE] Failed to send email notifications:`, emailError);
          // Don't fail the update if emails fail
        }
      }
    }

    return updatedEpisode;
  } catch (error) {
    logError('updateEpisodeDetails', error);
    throw new Error(`Failed to update episode: ${errorToString(error)}`);
  }
} 