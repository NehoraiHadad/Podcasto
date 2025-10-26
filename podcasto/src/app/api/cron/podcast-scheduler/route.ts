import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { apiSuccess, apiError, validateCronAuth, logError } from '@/lib/api';
import { PodcastScheduleData } from '@/lib/podcast-scheduler/types';
import { findPodcastsNeedingEpisodes } from '@/lib/podcast-scheduler/finder';
import { generateEpisodesForPodcasts } from '@/lib/podcast-scheduler/generator';
import { nowUTC, toISOUTC } from '@/lib/utils/date/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[PODCAST_SCHEDULER] Endpoint called');

    // Verify this is a legitimate cron request
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      console.error('[PODCAST_SCHEDULER] Authorization failed', {
        secretConfigured: !!process.env.CRON_SECRET,
        headerProvided: !!request.headers.get('Authorization')
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    console.log('[PODCAST_SCHEDULER] Authorization successful');

    // Find podcasts that need new episodes
    let podcastsNeedingEpisodes: PodcastScheduleData[] = [];

    try {
      podcastsNeedingEpisodes = await findPodcastsNeedingEpisodes();
    } catch (findError) {
      logError('[PODCAST_SCHEDULER]', findError, { operation: 'findPodcastsNeedingEpisodes' });
      return apiError('Error finding podcasts needing episodes', 500);
    }

    if (podcastsNeedingEpisodes.length === 0) {
      console.log('[PODCAST_SCHEDULER] No podcasts need new episodes');
      return apiSuccess({
        message: 'No podcasts need new episodes',
        timestamp: toISOUTC(nowUTC())
      });
    }

    console.log(`[PODCAST_SCHEDULER] Found ${podcastsNeedingEpisodes.length} podcasts needing episodes`);

    // Generate episodes for each podcast
    let results = [];

    try {
      results = await generateEpisodesForPodcasts(podcastsNeedingEpisodes);
    } catch (generateError) {
      logError('[PODCAST_SCHEDULER]', generateError, { operation: 'generateEpisodesForPodcasts' });
      return apiError('Error generating podcast episodes', 500);
    }

    // Revalidate paths
    try {
      revalidatePath('/admin/podcasts');
      revalidatePath('/podcasts');
    } catch (revalidateError) {
      console.warn('[PODCAST_SCHEDULER] Error revalidating paths:', revalidateError);
      // Continue despite revalidation errors
    }

    return apiSuccess({
      message: `Generated episodes for ${results.filter(r => r.success).length}/${podcastsNeedingEpisodes.length} podcasts`,
      results,
      timestamp: toISOUTC(nowUTC())
    });

  } catch (error) {
    logError('[PODCAST_SCHEDULER]', error, { operation: 'unhandled' });
    return apiError(error instanceof Error ? error : new Error('Unknown error'), 500);
  }
}
