import { generatePodcastEpisode } from '@/lib/actions/podcast/generate';
import { PodcastScheduleData } from './types';
import { EpisodeCheckerDetailedResult } from '@/components/admin/cron-runner-constants';
import { CreditService } from '@/lib/services/credits/credit-service';
import { getPodcastById } from '@/lib/db/api/podcasts/queries';
import { isUserAdmin } from '@/lib/db/api/user-roles';
import { logGenerationAttempt } from '@/lib/db/api/episode-generation-attempts';
import { determineTriggerSource } from '@/lib/utils/episode-server-utils';

/**
 * Represents the result of attempting to generate an episode for a single podcast.
 */
interface GenerationResult {
  podcastId: string;
  podcastTitle: string;
  success: boolean;
  episodeId?: string;
  message: string;
  reason?: 'success' | 'no_messages' | 'insufficient_credits' | 'error';
  checkerResult?: EpisodeCheckerDetailedResult;
}

/**
 * Generate episodes for the podcasts that need them
 * 
 * @param podcastsNeedingEpisodes - An array of podcast data objects that require new episodes.
 * @returns A promise that resolves to an array of GenerationResult objects.
 */
export async function generateEpisodesForPodcasts(
  podcastsNeedingEpisodes: PodcastScheduleData[]
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  const creditService = new CreditService();

  for (const podcast of podcastsNeedingEpisodes) {
    let generationResult: GenerationResult = {
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      success: false,
      message: 'An unexpected error occurred during generation.',
    };

    try {
      console.log(`[PODCAST_GENERATOR] Generating episode for podcast: ${podcast.title} (${podcast.id})`);

      // Get podcast details to check owner
      const podcastRecord = await getPodcastById(podcast.id);
      if (!podcastRecord) {
        generationResult.message = `Podcast not found: ${podcast.id}`;
        results.push(generationResult);
        continue;
      }

      // Check if podcast has an owner (user-created) and deduct credits BEFORE generation
      let deductionTransactionId: string | undefined;
      let creditsDeducted = false;

      if (podcastRecord.created_by) {
        // Check if the creator is an admin - admins never pay credits
        const isAdmin = await isUserAdmin(podcastRecord.created_by);

        if (isAdmin) {
          console.log(`[PODCAST_GENERATOR] Admin user (${podcastRecord.created_by}) - skipping credit check for podcast "${podcast.title}"`);
        } else {
          // Non-admin users: check and deduct credits BEFORE generation
          console.log(`[PODCAST_GENERATOR] Checking credits for user ${podcastRecord.created_by}`);

          const creditCheck = await creditService.checkCreditsForEpisode(podcastRecord.created_by);

          if (!creditCheck.hasEnough) {
            generationResult.message = `Insufficient credits for podcast "${podcast.title}". Required: ${creditCheck.required}, Available: ${creditCheck.available}`;
            console.warn(`[PODCAST_GENERATOR] ${generationResult.message}`);
            results.push(generationResult);
            continue;
          }

          console.log(`[PODCAST_GENERATOR] Credits verified for user ${podcastRecord.created_by}: ${creditCheck.available} available`);

          // DEDUCT CREDITS NOW (before episode generation)
          console.log(`[PODCAST_GENERATOR] Deducting credits for user ${podcastRecord.created_by} BEFORE generation`);
          const deductionResult = await creditService.deductCreditsForEpisode(
            podcastRecord.created_by,
            'pending-episode', // Temporary ID
            podcast.id
          );

          if (!deductionResult.success) {
            generationResult.message = `Failed to deduct credits for "${podcast.title}": ${deductionResult.error}`;
            console.error(`[PODCAST_GENERATOR] ${generationResult.message}`);
            results.push(generationResult);
            continue;
          }

          deductionTransactionId = deductionResult.transactionId;
          creditsDeducted = true;
          console.log(`[PODCAST_GENERATOR] Credits deducted successfully, balance: ${deductionResult.newBalance}, transaction: ${deductionTransactionId}`);
        }
      } else {
        console.log(`[PODCAST_GENERATOR] System podcast (no owner) - no credit check required`);
      }

      // Calculate date range based on telegram_hours
      const now = new Date();
      const startDate = new Date(now.getTime() - (podcast.telegramHours * 60 * 60 * 1000));
      const dateRange = {
        startDate,
        endDate: now
      };

      console.log(`[PODCAST_GENERATOR] Using date range for ${podcast.title}: ${startDate.toISOString()} to ${now.toISOString()}`);

      // Call the existing server action to generate the episode with date range
      const actionResult = await generatePodcastEpisode(podcast.id, dateRange);

      // If generation failed and credits were deducted, REFUND them
      if (!actionResult.success && creditsDeducted && podcastRecord.created_by) {
        console.log(`[PODCAST_GENERATOR] Generation failed after credit deduction, refunding credits for user ${podcastRecord.created_by}`);
        const refundResult = await creditService.refundCreditsForEpisode(
          podcastRecord.created_by,
          'failed-episode',
          podcast.id,
          'Episode generation failed'
        );

        if (!refundResult.success) {
          console.error(`[PODCAST_GENERATOR] CRITICAL: Failed to refund credits after generation failure:`, refundResult.error);
        } else {
          console.log(`[PODCAST_GENERATOR] Credits refunded successfully, balance: ${refundResult.newBalance}`);
        }
      }

      // Determine the reason for success/failure
      let reason: 'success' | 'no_messages' | 'insufficient_credits' | 'error' = 'error';
      if (actionResult.success) {
        reason = 'success';
      } else if (actionResult.error?.includes('No new messages') || actionResult.error?.includes('no new messages')) {
        reason = 'no_messages';
      } else if (actionResult.error?.includes('Insufficient credits')) {
        reason = 'insufficient_credits';
      }

      generationResult = {
        ...generationResult,
        success: actionResult.success,
        episodeId: actionResult.episodeId,
        reason,
        message: actionResult.success
          ? `Generation started for podcast: ${podcast.title}`
          : `${reason === 'no_messages' ? 'No messages' : 'Error'}: ${actionResult.error}`,
      };

      // Log the generation attempt to database for tracking and reporting
      try {
        const attemptLogResult = await logGenerationAttempt({
          podcastId: podcast.id,
          episodeId: actionResult.episodeId,
          triggeredBy: undefined, // CRON has no user
          status: reason === 'success'
            ? 'success'
            : reason === 'no_messages'
              ? 'failed_no_messages'
              : reason === 'insufficient_credits'
                ? 'failed_insufficient_credits'
                : 'failed_error',
          triggerSource: await determineTriggerSource(undefined),
          contentStartDate: startDate,
          contentEndDate: now,
          failureReason: !actionResult.success ? actionResult.error : undefined,
          errorDetails: !actionResult.success ? {
            error_message: actionResult.error,
            channel_name: podcastRecord.title,
            ...(reason === 'no_messages' && {
              latest_message_date: new Date().toISOString(), // Best effort estimate
            }),
            ...(reason === 'insufficient_credits' && {
              credits_required: 1, // Standard episode cost
              credits_available: 0, // Unknown from this context
            }),
          } : undefined,
        });

        if (!attemptLogResult.success) {
          console.warn(`[PODCAST_GENERATOR] Failed to log attempt for "${podcast.title}": ${attemptLogResult.error}`);
        } else {
          console.log(`[PODCAST_GENERATOR] Logged attempt for "${podcast.title}" (status: ${reason})`);
        }
      } catch (logError) {
        // Non-blocking: log the error but continue processing
        console.error(`[PODCAST_GENERATOR] Error logging generation attempt:`, logError);
      }

      // Enhanced logging based on reason
      if (reason === 'no_messages') {
        console.log(`[PODCAST_GENERATOR] No new messages in Telegram channel for "${podcast.title}" - email notification sent to creator`);
      } else if (reason === 'insufficient_credits') {
        console.warn(`[PODCAST_GENERATOR] Insufficient credits for "${podcast.title}"`);
      } else if (!actionResult.success) {
        console.error(`[PODCAST_GENERATOR] Generation failed for "${podcast.title}":`, actionResult.error);
      }

      // Log credit status in generation result message
      if (actionResult.success && actionResult.episodeId && podcastRecord.created_by) {
        const isAdmin = await isUserAdmin(podcastRecord.created_by);

        if (!isAdmin) {
          console.log(`[PODCAST_GENERATOR] Credits were charged for user ${podcastRecord.created_by}`);
          generationResult.message += ' | Credits charged';
        } else {
          console.log(`[PODCAST_GENERATOR] Admin user - no credits charged`);
          generationResult.message += ' | Admin - no credits charged';
        }
      } else if (!actionResult.success && creditsDeducted) {
        generationResult.message += ' | Credits refunded';
      }

      // If the episode was created successfully and we have an ID,
      // immediately call the episode-checker for it
      if (actionResult.success && actionResult.episodeId && cronSecret) {
        try {
          console.log(`[PODCAST_GENERATOR] Immediately checking new episode: ${actionResult.episodeId}`);
          
          // Short wait to potentially allow async processes to initialize
          await new Promise(resolve => setTimeout(resolve, 2000)); 
          
          const checkerUrl = `${baseUrl}/api/cron/episode-checker?episodeId=${actionResult.episodeId}`;
          console.log(`[PODCAST_GENERATOR] Calling checker URL: ${checkerUrl}`);

          const checkerResponse = await fetch(checkerUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cronSecret}`
            }
          });

          const checkerData = await checkerResponse.json();
          console.log(`[PODCAST_GENERATOR] Checker response for episode ${actionResult.episodeId}:`, checkerData);
          generationResult.checkerResult = checkerData;
          generationResult.message += checkerResponse.ok 
            ? ' | Checker endpoint called successfully.' 
            : ' | Checker endpoint call failed.';

        } catch (checkerError) {
          console.error(`[PODCAST_GENERATOR] Error calling episode checker for ${actionResult.episodeId}:`, checkerError);
          generationResult.message += ' | Error occurred while calling checker.';
          // Keep generationResult.success as true, since generation itself succeeded
        }
      } else if (actionResult.success && actionResult.episodeId && !cronSecret) {
          console.warn(`[PODCAST_GENERATOR] CRON_SECRET not configured. Skipping immediate check for episode ${actionResult.episodeId}`);
          generationResult.message += ' | Skipping immediate check (no CRON_SECRET).';
      }

    } catch (error) {
      console.error(`[PODCAST_GENERATOR] Error generating episode for ${podcast.title}:`, error);
      generationResult.success = false;
      generationResult.message = error instanceof Error ? error.message : 'Unknown generation error';
    }
    
    results.push(generationResult);
  }
  
  return results;
} 