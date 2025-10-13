'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from './auth-actions';
import type { CronOperationResult } from './types';

/**
 * Helper function to call a CRON endpoint with proper authentication
 *
 * This function:
 * 1. Verifies the user is an admin (redirects if not)
 * 2. Calls the specified CRON endpoint with authentication
 * 3. Revalidates relevant admin pages after completion
 *
 * @param endpoint The API endpoint to call (e.g., '/api/cron/episode-checker')
 * @param logPrefix Prefix for console logs
 * @returns Result of the CRON operation
 *
 * @internal This is an internal helper and should not be exported from the module
 */
async function callCronEndpoint(endpoint: string, logPrefix: string): Promise<CronOperationResult> {
  // Ensure the user is an admin
  await checkIsAdmin({ redirectOnFailure: true });

  try {
    // Construct the API URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const apiUrl = new URL(endpoint, baseUrl).toString();
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return {
        success: false,
        message: 'CRON_SECRET environment variable is not configured'
      };
    }

    console.log(`[${logPrefix}] Triggering endpoint at: ${apiUrl}`);

    // Call the API with the CRON secret
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log(`[${logPrefix}] Endpoint completed with result:`, result);

    // Revalidate admin pages
    revalidatePath('/admin/episodes');
    revalidatePath('/admin/podcasts');

    return {
      success: true,
      message: `Successfully ran ${logPrefix.toLowerCase()}`,
      details: result
    };
  } catch (error) {
    console.error(`[${logPrefix}] Error running endpoint:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Manually triggers the CRON episode checker process
 * This is a server action that requires admin permissions
 *
 * The episode checker scans for episodes that need to be processed
 * and triggers any pending episode generation tasks.
 *
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await runEpisodeChecker();
 * if (result.success) {
 *   toast.success(result.message);
 * }
 */
export async function runEpisodeChecker(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/cron/episode-checker', 'MANUAL_EPISODE_CHECKER');
}

/**
 * Manually triggers the podcast scheduler process
 * This is a server action that requires admin permissions
 *
 * The podcast scheduler checks which podcasts are due for new episodes
 * and creates pending episode records for them.
 *
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await runPodcastScheduler();
 * if (result.success) {
 *   console.log('Scheduled episodes:', result.details);
 * }
 */
export async function runPodcastScheduler(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/cron/podcast-scheduler', 'MANUAL_PODCAST_SCHEDULER');
}

/**
 * Manually triggers the main CRON job which runs all scheduled tasks
 * This simulates what happens when the external CRON scheduler runs
 *
 * This runs multiple CRON tasks in sequence:
 * - Podcast scheduler
 * - Episode checker
 * - Other maintenance tasks
 *
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await runAllCronJobs();
 * // This will run all scheduled tasks
 */
export async function runAllCronJobs(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/cron/start-jobs', 'MANUAL_FULL_CRON');
}

/**
 * Manually triggers the Google TTS audio generation process
 * This uses the new Google-based audio generation API instead of Podcastfy
 *
 * Triggers immediate audio generation for pending episodes using
 * Google's Text-to-Speech API via the Lambda function.
 *
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await runGoogleAudioGenerator();
 * if (result.success) {
 *   // Audio generation started
 * }
 */
export async function runGoogleAudioGenerator(): Promise<CronOperationResult> {
  return callCronEndpoint('/api/episodes/generate-audio', 'MANUAL_GOOGLE_AUDIO_GENERATOR');
}
