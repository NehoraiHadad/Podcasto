import { NextRequest } from 'next/server';
import { apiSuccess, apiError, validateCronAuth, logError } from '@/lib/api';

/**
 * Starts all cron jobs in the application
 * This endpoint is called by an external cron scheduler (e.g., cron.job, GitHub Actions, Vercel Cron)
 *
 * Accepts optional 'target' query parameter to run specific jobs:
 * - 'episode-checker' - Runs only the episode checker job
 * - 'podcast-scheduler' - Runs only the podcast scheduler job
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[CRON] start-jobs endpoint called');

    // Verify this is a legitimate cron request
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      console.error('[CRON] Authorization failed:', {
        secretConfigured: !!process.env.CRON_SECRET,
        headerProvided: !!request.headers.get('Authorization')
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    console.log('[CRON] Authorization successful');

    // Check if a specific target job was requested
    const targetJob = request.nextUrl.searchParams.get('target');
    console.log(`[CRON] Target job requested: ${targetJob || 'none (running all jobs)'}`);

    const cronSecret = process.env.CRON_SECRET;
    const jobResults = [];

    // Run episode-checker (if no target specified or target is 'episode-checker')
    if (!targetJob || targetJob === 'episode-checker') {
      try {
        console.log('[CRON] Preparing to call episode-checker');

        const episodeCheckerUrl = new URL('/api/cron/episode-checker', request.url);

        // Pass through any episodeId if it exists
        const episodeId = request.nextUrl.searchParams.get('episodeId');
        if (episodeId) {
          episodeCheckerUrl.searchParams.set('episodeId', episodeId);
        }

        console.log('[CRON] Calling URL:', episodeCheckerUrl.toString());

        const episodeCheckerResponse = await fetch(
          episodeCheckerUrl,
          {
            headers: {
              'Authorization': `Bearer ${cronSecret}`
            }
          }
        );

        console.log('[CRON] episode-checker response status:', episodeCheckerResponse.status);

        const episodeCheckerResult = await episodeCheckerResponse.json();
        console.log('[CRON] episode-checker result:', JSON.stringify(episodeCheckerResult, null, 2));

        jobResults.push({
          job: 'episode-checker',
          success: episodeCheckerResponse.ok,
          status: episodeCheckerResponse.status,
          result: episodeCheckerResult
        });
      } catch (error) {
        logError('[CRON]', error, { job: 'episode-checker' });
        jobResults.push({
          job: 'episode-checker',
          success: false,
          error: error?.toString() || 'Unknown error'
        });
      }
    }

    // Run podcast-scheduler (only if no target specified or target is 'podcast-scheduler')
    if (!targetJob || targetJob === 'podcast-scheduler') {
      try {
        console.log('[CRON] Preparing to call podcast-scheduler');

        const podcastSchedulerUrl = new URL('/api/cron/podcast-scheduler', request.url);
        console.log('[CRON] Calling URL:', podcastSchedulerUrl.toString());

        const podcastSchedulerResponse = await fetch(
          podcastSchedulerUrl,
          {
            headers: {
              'Authorization': `Bearer ${cronSecret}`
            }
          }
        );

        console.log('[CRON] podcast-scheduler response status:', podcastSchedulerResponse.status);

        const podcastSchedulerResult = await podcastSchedulerResponse.json();
        console.log('[CRON] podcast-scheduler result:', JSON.stringify(podcastSchedulerResult, null, 2));

        jobResults.push({
          job: 'podcast-scheduler',
          success: podcastSchedulerResponse.ok,
          status: podcastSchedulerResponse.status,
          result: podcastSchedulerResult
        });
      } catch (error) {
        logError('[CRON]', error, { job: 'podcast-scheduler' });
        jobResults.push({
          job: 'podcast-scheduler',
          success: false,
          error: error?.toString() || 'Unknown error'
        });
      }
    }

    // Add more cron jobs here as needed
    // For example:
    // - User notification sender
    // - Analytics processor
    // - Database cleanup tasks

    // Return results
    console.log('[CRON] All jobs completed. Results:', JSON.stringify(jobResults, null, 2));

    return apiSuccess({
      timestamp: new Date().toISOString(),
      results: jobResults
    });
  } catch (error) {
    logError('[CRON]', error, { operation: 'start_cron_jobs' });
    return apiError(error instanceof Error ? error : new Error('Unknown error'), 500);
  }
}
