import { NextRequest } from 'next/server';
import { episodesApi } from '@/lib/db/api';
import {
  apiSuccess,
  apiError,
  validateCronAuth,
  logError
} from '@/lib/api';
import { sendEpisodesToSQS, sendEpisodeToSQS, updateEpisodeStatus } from './helpers';
import type { GenerateAudioRequest } from './types';

const logPrefix = '[AUDIO_TRIGGER]';

/**
 * GET method - Manual trigger for CRON jobs
 * Finds pending episodes and sends them to AWS Lambda via existing SQS queue
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      logError(logPrefix, new Error('Unauthorized trigger attempt'), {
        hasAuth: !!request.headers.get('Authorization')
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    console.log(`${logPrefix} Manual trigger started - auth successful`);

    // Find episodes that have content collected and need audio generation
    const pendingEpisodes = await episodesApi.getEpisodesByStatus(['content_collected']);

    console.log(`${logPrefix} Found ${pendingEpisodes?.length || 0} episodes with content_collected status`);

    if (!pendingEpisodes || pendingEpisodes.length === 0) {
      return apiSuccess({
        message: 'No episodes with content_collected status found',
        timestamp: new Date().toISOString(),
        processed: 0,
        errors: 0,
        results: []
      });
    }

    console.log(`${logPrefix} Episodes to process:`, pendingEpisodes.map(e => ({
      id: e.id,
      title: e.title,
      status: e.status
    })));

    // Send episodes to existing SQS for processing by Lambda
    const results = await sendEpisodesToSQS(pendingEpisodes);

    return apiSuccess({
      message: `Sent ${results.successful} episodes to processing queue`,
      timestamp: new Date().toISOString(),
      processed: results.successful,
      errors: results.failed,
      results: results.details
    });

  } catch (error) {
    logError(logPrefix, error, { context: 'Manual trigger' });
    return apiError(error instanceof Error ? error : new Error(String(error)), 500);
  }
}

/**
 * POST method - Individual episode trigger
 * Sends a specific episode to AWS Lambda via existing SQS queue
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let episodeId: string | undefined;

  try {
    console.log(`${logPrefix} Manual audio generation triggered`);

    // Get episodes that are ready for audio generation
    const pendingEpisodes = await episodesApi.getEpisodesByStatus(['content_collected', 'script_ready']);

    console.log(`${logPrefix} Found ${pendingEpisodes?.length || 0} episodes with content_collected or script_ready status`);

    if (!pendingEpisodes || pendingEpisodes.length === 0) {
      return apiSuccess({
        message: 'No episodes with content_collected or script_ready status found',
        count: 0
      });
    }

    // Parse request body
    const body: GenerateAudioRequest = await request.json();
    episodeId = body.episodeId;

    if (!episodeId) {
      return apiError('Episode ID is required', 400);
    }

    console.log(`${logPrefix} Starting audio generation trigger for episode: ${episodeId}`);

    // Get episode data
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      return apiError('Episode not found', 404);
    }

    if (!episode.podcast_id) {
      return apiError('Episode podcast_id is missing', 400);
    }

    // Send single episode to existing SQS
    const result = await sendEpisodeToSQS({
      id: episode.id,
      title: episode.title,
      podcast_id: episode.podcast_id!
    }, body.s3Path);

    const processingTime = Date.now() - startTime;
    console.log(`${logPrefix} Successfully triggered audio generation for episode ${episodeId} in ${processingTime}ms`);

    return apiSuccess({
      episodeId,
      message: result.success ? 'Episode sent to processing queue' : 'Failed to send episode to queue',
      processingTime,
      sqsMessageId: result.messageId,
      success: result.success
    });

  } catch (error) {
    logError(logPrefix, error, { episodeId, context: 'Audio generation trigger' });

    // Update episode status to 'failed' if we have an episode ID
    if (episodeId) {
      try {
        await updateEpisodeStatus(episodeId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      } catch (updateError) {
        logError(logPrefix, updateError, {
          episodeId,
          context: 'Failed to update episode status'
        });
      }
    }

    return apiError(error instanceof Error ? error : new Error(String(error)), 500);
  }
}
