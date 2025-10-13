import { NextRequest } from 'next/server';
import { apiSuccess, apiError, validateCronAuth, logError } from '@/lib/api';
import { EpisodeCheckResults } from '@/lib/episode-checker/types';
import * as CheckerConstants from '@/lib/episode-checker/constants';
import { getPostProcessingService } from '@/lib/episode-checker/service-factory';
import { findEpisodeById, findAllEpisodesToCheck } from '@/lib/episode-checker/finder';
import { processSingleEpisode } from '@/lib/episode-checker/processor';

/**
 * Checks for episodes that have been pending for too long and marks them as failed.
 * Also processes any episodes that have completed audio generation but haven't been processed yet.
 *
 * Can accept an optional episode ID parameter to check only a specific episode.
 */
export async function GET(request: NextRequest) {
  const mainLogPrefix = '[EPISODE_CHECKER_ROUTE]';
  try {
    console.log(`${mainLogPrefix} Endpoint called`);

    // Authorization
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      console.error(`${mainLogPrefix} Authorization failed:`, {
        secretConfigured: !!process.env.CRON_SECRET,
        headerProvided: !!request.headers.get('Authorization')
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }
    console.log(`${mainLogPrefix} Authorization successful`);

    // Get post-processing config
    const postProcessingEnabled = process.env.ENABLE_POST_PROCESSING === 'true';
    const postProcessingService = getPostProcessingService();
    console.log(`${mainLogPrefix} Post-processing ${postProcessingEnabled ? 'enabled' : 'disabled'}, service ${postProcessingService ? 'available' : 'unavailable'}`);

    // Check mode: Specific episode or Batch?
    const episodeId = request.nextUrl.searchParams.get('episodeId');

    // --- SPECIFIC EPISODE MODE ---
    if (episodeId) {
      console.log(`${mainLogPrefix} Checking specific episode: ${episodeId}`);
      const episode = await findEpisodeById(episodeId);

      if (!episode) {
        console.error(`${mainLogPrefix} Episode with ID ${episodeId} not found`);
        return apiError('Episode not found', 404);
      }

      console.log(`${mainLogPrefix} Found episode: ${JSON.stringify(episode, null, 2)}`);
      const result = await processSingleEpisode(episode, postProcessingService, postProcessingEnabled);

      console.log(`${mainLogPrefix} Processing result for ${episodeId}:`, result);
      return apiSuccess({
        timestamp: new Date().toISOString(),
        results: {
          checked: 1,
          timed_out: result.status === 'timed_out' ? 1 : 0,
          completed: result.status === 'completed' ? 1 : 0,
          processed: result.status === 'processed' ? 1 : 0,
          published: result.status === 'published' ? 1 : 0,
          requires_processing: 0,
          errors: result.error ? [result.error] : []
        }
      });
    }

    // --- BATCH MODE ---
    console.log(`${mainLogPrefix} Starting batch check`);
    const episodesToCheck = await findAllEpisodesToCheck();

    const aggregatedResults: EpisodeCheckResults = {
      checked: episodesToCheck.length,
      timed_out: 0,
      completed: 0,
      processed: 0,
      published: 0,
      requires_processing: 0,
      errors: []
    };

    if (aggregatedResults.checked === 0) {
      console.log(`${mainLogPrefix} No pending or completed or summary completed episodes found for batch check.`);
      return apiSuccess({
        message: 'No episodes needed checking.',
        timestamp: new Date().toISOString(),
        results: aggregatedResults
      });
    }

    console.log(`${mainLogPrefix} Found ${aggregatedResults.checked} episodes for batch check.`);

    // Process each episode
    for (const episode of episodesToCheck) {
      // Determine if this episode might require processing based on its initial state
      if (episode.status === CheckerConstants.COMPLETED_STATUS && postProcessingEnabled) {
        aggregatedResults.requires_processing++;
      }
      if (episode.status === CheckerConstants.PENDING_STATUS && postProcessingEnabled && episode.audio_url) {
        aggregatedResults.requires_processing++;
      }
      if (episode.status === CheckerConstants.SUMMARY_COMPLETED_STATUS && postProcessingEnabled && episode.audio_url) {
        aggregatedResults.requires_processing++;
      }

      const result = await processSingleEpisode(episode, postProcessingService, postProcessingEnabled);

      // Update aggregated results based on the outcome
      switch (result.status) {
        case 'timed_out':
          aggregatedResults.timed_out++;
          break;
        case 'completed':
          aggregatedResults.completed++;
          break;
        case 'processed':
          aggregatedResults.processed++;
          break;
        case 'published':
          aggregatedResults.published++;
          break;
        case 'failed':
          // Error message added below
          break;
        case 'no_change':
          // No count needs incrementing for no_change
          break;
      }

      if (result.error) {
        aggregatedResults.errors.push(`Episode ${result.episodeId}: ${result.error}`);
      }
    }

    console.log(`${mainLogPrefix} Completed batch check. Results:`, JSON.stringify(aggregatedResults, null, 2));
    return apiSuccess({
      timestamp: new Date().toISOString(),
      results: aggregatedResults
    });

  } catch (error) {
    logError(mainLogPrefix, error, { operation: 'unhandled' });
    return apiError(error instanceof Error ? error : new Error('Unknown error'), 500);
  }
}
