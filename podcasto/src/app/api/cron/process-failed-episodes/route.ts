import { NextRequest } from 'next/server';
import { apiSuccess, apiError, validateCronAuth, logError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    console.log('[CRON_FAILED_EPISODES] Starting failed episodes processing');

    // Check authorization for CRON jobs
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      console.log('[CRON_FAILED_EPISODES] Unauthorized CRON access');
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    // Import database API
    const { episodesApi } = await import('@/lib/db/api');

    // Get episodes that are still pending or failed for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Find episodes that need processing
    const failedEpisodes = await episodesApi.getEpisodesByStatus(['pending', 'failed']);
    const episodesToProcess = failedEpisodes.filter(episode =>
      new Date(episode.created_at!) < tenMinutesAgo
    );

    if (episodesToProcess.length === 0) {
      console.log('[CRON_FAILED_EPISODES] No failed episodes to process');
      return apiSuccess({
        message: 'No failed episodes found',
        processed: 0
      });
    }

    console.log(`[CRON_FAILED_EPISODES] Found ${episodesToProcess.length} episodes to retry`);

    const results = [];

    // Process each failed episode
    for (const episode of episodesToProcess) {
      try {
        // Call our generation API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/episodes/generate-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
          },
          body: JSON.stringify({
            episodeId: episode.id,
            podcastId: episode.podcast_id,
            // Try to find S3 path from metadata
            s3Path: episode.metadata ? JSON.parse(episode.metadata as string)?.s3_key : undefined
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log(`[CRON_FAILED_EPISODES] Successfully retried episode: ${episode.id}`);
          results.push({
            episodeId: episode.id,
            status: 'success'
          });
        } else {
          console.error(`[CRON_FAILED_EPISODES] Failed to retry episode ${episode.id}: ${result.error}`);
          results.push({
            episodeId: episode.id,
            status: 'failed',
            error: result.error
          });
        }

      } catch (error) {
        logError('[CRON_FAILED_EPISODES]', error, { episodeId: episode.id });
        results.push({
          episodeId: episode.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return apiSuccess({
      message: `Processed ${episodesToProcess.length} failed episodes`,
      processed: results.length,
      results
    });

  } catch (error) {
    logError('[CRON_FAILED_EPISODES]', error, { operation: 'cron_job' });
    return apiError(error instanceof Error ? error : new Error('Unknown error'), 500);
  }
}

// Health check
export async function POST() {
  return apiSuccess({
    status: 'healthy',
    service: 'Failed Episodes Processor',
    timestamp: new Date().toISOString()
  });
}
