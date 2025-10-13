import { NextRequest } from 'next/server';
import { episodesApi } from '@/lib/db/api';
import { getPostProcessingService } from '@/lib/episode-checker/service-factory';
import {
  apiSuccess,
  apiError,
  validateLambdaAuth,
  logError
} from '@/lib/api';

/**
 * Lambda completion callback endpoint
 * Called by audio-generation-lambda when episode processing is completed
 * Triggers immediate post-processing (title/summary generation, image creation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  const logPrefix = '[LAMBDA_CALLBACK]';

  try {
    console.log(`${logPrefix} Completion callback received for episode: ${episodeId}`);

    // 1. Verify Lambda authentication
    const authResult = validateLambdaAuth(request);
    if (!authResult.valid) {
      logError(logPrefix, new Error('Unauthorized callback attempt'), {
        episodeId
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    // 2. Parse callback payload
    const payload = await request.json();
    const { status, audio_url, duration } = payload;

    console.log(`${logPrefix} Callback payload:`, {
      episodeId,
      status,
      audio_url: audio_url ? 'present' : 'missing',
      duration
    });

    // 3. Verify episode exists and has expected status
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      logError(logPrefix, new Error('Episode not found'), { episodeId });
      return apiError('Episode not found', 404);
    }

    if (!episode.podcast_id) {
      logError(logPrefix, new Error('Episode has no podcast_id'), { episodeId });
      return apiError('Episode has no podcast_id', 400);
    }

    // 4. Verify episode is in completed status (should be updated by Lambda)
    if (episode.status !== 'completed') {
      console.warn(`${logPrefix} Episode ${episodeId} status is ${episode.status}, expected 'completed'`);
      // Continue anyway - Lambda might have updated status after our query
    }

    // 5. Check if post-processing is enabled
    const postProcessingEnabled = process.env.ENABLE_POST_PROCESSING === 'true';
    if (!postProcessingEnabled) {
      console.log(`${logPrefix} Post-processing disabled, skipping for episode ${episodeId}`);
      return apiSuccess({
        message: 'Callback received, post-processing disabled'
      });
    }

    // 6. Get post-processing service
    const postProcessingService = getPostProcessingService();
    if (!postProcessingService) {
      logError(logPrefix, new Error('Post-processing service not available'), {
        episodeId
      });
      return apiError('Post-processing service not available', 500);
    }

    // 7. Trigger immediate post-processing
    console.log(`${logPrefix} Starting immediate post-processing for episode ${episodeId}`);

    const processingResult = await postProcessingService.processCompletedEpisode(
      episode.podcast_id,
      episodeId,
      {
        forceReprocess: false, // Don't force reprocess
        skipTitleGeneration: false,
        skipSummaryGeneration: false,
        skipImageGeneration: false
      }
    );

    if (processingResult.success) {
      console.log(`${logPrefix} Post-processing completed successfully for episode ${episodeId}`);

      // 8. Revalidate paths to update UI immediately
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/admin/podcasts');
      revalidatePath(`/podcasts/${episode.podcast_id}`);
      revalidatePath(`/podcasts/${episode.podcast_id}/episodes/${episodeId}`);

      // 9. Check if episode was published and send email notifications
      const updatedEpisode = await episodesApi.getEpisodeById(episodeId);
      if (updatedEpisode?.status === 'published') {
        console.log(`${logPrefix} Episode published, sending email notifications`);

        try {
          const { sendNewEpisodeNotification } = await import('@/lib/services/email');
          const emailResult = await sendNewEpisodeNotification(episodeId);
          console.log(`${logPrefix} Email notifications sent: ${emailResult.emailsSent}/${emailResult.totalSubscribers}`);
        } catch (emailError) {
          logError(logPrefix, emailError, {
            episodeId,
            context: 'Email notification failed'
          });
          // Don't fail the response if emails fail
        }
      }

      return apiSuccess({
        message: 'Episode post-processing completed successfully',
        episode: processingResult.episode
      });
    } else {
      logError(logPrefix, new Error('Post-processing failed'), {
        episodeId,
        reason: processingResult.message
      });
      return apiError(`Post-processing failed: ${processingResult.message}`, 500);
    }

  } catch (error) {
    logError(logPrefix, error, {
      episodeId,
      context: 'Callback processing'
    });
    return apiError(error instanceof Error ? error : new Error(String(error)), 500);
  }
}

/**
 * GET method for health check / testing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;

  // Simple health check - verify episode exists
  try {
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      return apiError('Episode not found', 404);
    }

    return apiSuccess({
      message: 'Callback endpoint is ready',
      episode: {
        id: episode.id,
        status: episode.status,
        podcast_id: episode.podcast_id
      }
    });
  } catch (error) {
    return apiError(error instanceof Error ? error : new Error(String(error)), 500);
  }
}
