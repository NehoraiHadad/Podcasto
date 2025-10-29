'use server';

/**
 * Main orchestrator for podcast episode generation.
 * Coordinates validation, episode creation, and Lambda invocation.
 */

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import {
  checkEnvironmentConfiguration,
  validateDateRange,
  fetchPodcastConfig,
  createPendingEpisode,
  invokeLambdaFunction
} from './generation';
import { handleMessagePreCheck } from './generation/message-check-handler';
import { sendNoMessagesNotification } from '@/lib/actions/send-creator-notification';
import { getPodcastById } from '@/lib/db/api/podcasts/queries';
import { logGenerationAttempt } from '@/lib/db/api/episode-generation-attempts';
import { determineTriggerSource } from '@/lib/utils/episode-server-utils';

// Re-export types for backward compatibility
export type { DateRange, GenerationResult } from './generation/types';

import type { DateRange, GenerationResult } from './generation/types';

/**
 * Triggers immediate podcast generation for a specific podcast.
 * Orchestrates the full generation flow from validation to Lambda invocation.
 *
 * @param podcastId - The ID of the podcast to generate
 * @param dateRange - Optional date range for content collection
 * @returns GenerationResult with success status and episode details
 */
export async function generatePodcastEpisode(
  podcastId: string,
  dateRange?: DateRange
): Promise<GenerationResult> {
  try {
    // Validate the podcast ID
    if (!podcastId) {
      return { success: false, error: 'Podcast ID is required' };
    }

    // Validate date range if provided
    if (dateRange) {
      const validationResult = validateDateRange(dateRange);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    // Get current user if available (will be null for cron jobs)
    const user = await getUser();

    // Log the generation request
    console.log(`[PODCAST_GEN] Starting generation for podcast ID: ${podcastId}`);
    if (user) {
      console.log(`[PODCAST_GEN] Triggered by user: ${user.id}`);
    } else {
      console.log(`[PODCAST_GEN] Triggered by automated scheduler`);
    }
    if (dateRange) {
      console.log(`[PODCAST_GEN] Using custom date range: ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`);
    }

    // Check environment configuration
    const envCheck = checkEnvironmentConfiguration();
    if (!envCheck.success) {
      return envCheck;
    }

    // Get podcast config for generation parameters
    const configResult = await fetchPodcastConfig(podcastId);
    if (!configResult.success || !configResult.config) {
      return { success: false, error: configResult.error || 'Failed to get podcast config' };
    }

    const podcastConfig = configResult.config as {
      telegram_channel?: string;
      telegram_hours?: number;
      podcast_name: string;
      [key: string]: unknown;
    };

    // ============================================================================
    // PRE-CHECK: Verify there are new messages before creating episode
    // ============================================================================
    if (podcastConfig.telegram_channel) {
      console.log(`[PODCAST_GEN] Checking for new messages in ${podcastConfig.telegram_channel}`);

      try {
        // Calculate date range for message check
        let messageCheckOptions: { startDate: Date; endDate: Date } | number;
        if (dateRange) {
          // Use custom date range if provided
          messageCheckOptions = {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          };
        } else {
          // Use telegram_hours from config (convert to days)
          const hoursBack = podcastConfig.telegram_hours || 24;
          messageCheckOptions = hoursBack / 24;
        }

        // Check for new messages and determine routing
        const checkResult = await handleMessagePreCheck(
          podcastId,
          podcastConfig.telegram_channel,
          messageCheckOptions,
          podcastConfig.channel_access_status as string | null | undefined
        );

        // If should stop (no messages in accessible channel), handle notifications and logging
        if (checkResult.shouldStop) {
          console.log(`[PODCAST_GEN] No new messages found in ${podcastConfig.telegram_channel}`);

          // Determine if this is an automated CRON trigger (no user session)
          const isAutomatedTrigger = !user;

          if (isAutomatedTrigger) {
            // For CRON triggers: send email notification to creator
            console.log(`[PODCAST_GEN] Automated trigger detected - will send email notification`);

            // Get podcast record to find creator
            const podcast = await getPodcastById(podcastId);

            if (podcast?.created_by) {
              // Calculate actual date range used for checking
              const actualDateRange = typeof messageCheckOptions === 'number'
                ? {
                    start: new Date(Date.now() - messageCheckOptions * 24 * 60 * 60 * 1000),
                    end: new Date()
                  }
                : {
                    start: messageCheckOptions.startDate,
                    end: messageCheckOptions.endDate
                  };

              // Send notification (non-blocking - errors logged but don't fail the flow)
              const notificationResult = await sendNoMessagesNotification({
                podcastId,
                creatorUserId: podcast.created_by,
                channelName: podcastConfig.telegram_channel,
                dateRange: actualDateRange
              });

              if (notificationResult.success) {
                console.log(`[PODCAST_GEN] Email notification sent successfully`);
              } else {
                console.warn(`[PODCAST_GEN] Failed to send email notification:`, notificationResult.error);
              }
            }
          }

          // Log the failed attempt for tracking
          try {
            const triggerSource = await determineTriggerSource(user);

            await logGenerationAttempt({
              podcastId,
              triggeredBy: user?.id,
              status: 'failed_no_messages',
              triggerSource,
              contentStartDate: typeof messageCheckOptions === 'object'
                ? messageCheckOptions.startDate
                : new Date(Date.now() - messageCheckOptions * 24 * 60 * 60 * 1000),
              contentEndDate: typeof messageCheckOptions === 'object'
                ? messageCheckOptions.endDate
                : new Date(),
              failureReason: `No new messages found in ${podcastConfig.telegram_channel}`,
              errorDetails: {
                channel_name: podcastConfig.telegram_channel,
                latest_message_date: checkResult.latestMessageDate?.toISOString(),
                error_message: 'No new messages in specified time range',
              },
            });

            console.log(`[PODCAST_GEN] Logged failed attempt (no messages) for podcast ${podcastId}`);
          } catch (logError) {
            // Non-blocking: don't fail the flow if logging fails
            console.error(`[PODCAST_GEN] Error logging failed attempt:`, logError);
          }

          // Return error response (prevents episode creation and Lambda invocation)
          return {
            success: false,
            error: checkResult.errorMessage || 'No new messages found'
          };
        }

        // If should proceed, continue to episode generation
        console.log(`[PODCAST_GEN] Proceeding with episode generation (status: ${checkResult.accessStatus})`);
      } catch (error) {
        // Log error but don't fail the entire generation
        // This ensures that if the pre-check fails, we still try to generate
        console.error(`[PODCAST_GEN] Error during message pre-check:`, error);
        console.log(`[PODCAST_GEN] Continuing with episode generation despite pre-check error`);
      }
    } else {
      console.log(`[PODCAST_GEN] No Telegram channel configured, skipping pre-check`);
    }
    // ============================================================================
    // END PRE-CHECK
    // ============================================================================

    // Create a new episode record
    const timestamp = new Date().toISOString();
    const episodeResult = await createPendingEpisode(podcastId, timestamp, dateRange, user?.id);
    if (!episodeResult.success) {
      return episodeResult;
    }

    // Invoke Telegram Lambda to collect data and trigger processing via SQS
    const lambdaResult = await invokeLambdaFunction({
      podcastId,
      episodeId: episodeResult.episodeId!,
      podcastConfig: configResult.config,
      timestamp,
      dateRange
    });

    if (!lambdaResult.success) {
      return lambdaResult;
    }

    // Revalidate the podcasts page to show the updated status
    revalidatePath('/admin/podcasts');

    // Log the successful generation attempt
    try {
      const triggerSource = await determineTriggerSource(user);

      await logGenerationAttempt({
        podcastId,
        episodeId: episodeResult.episodeId,
        triggeredBy: user?.id,
        status: 'success',
        triggerSource,
        contentStartDate: dateRange?.startDate,
        contentEndDate: dateRange?.endDate,
      });

      console.log(`[PODCAST_GEN] Logged successful attempt for podcast ${podcastId}`);
    } catch (logError) {
      // Non-blocking: don't fail on logging errors
      console.error(`[PODCAST_GEN] Error logging successful attempt:`, logError);
    }

    return {
      success: true,
      message: 'Podcast generation has been triggered',
      timestamp,
      episodeId: episodeResult.episodeId
    };
  } catch (error) {
    console.error('Error in generatePodcastEpisode:', error);

    // Log the error attempt
    try {
      const user = await getUser();
      const triggerSource = await determineTriggerSource(user);

      await logGenerationAttempt({
        podcastId,
        triggeredBy: user?.id,
        status: 'failed_error',
        triggerSource,
        contentStartDate: dateRange?.startDate,
        contentEndDate: dateRange?.endDate,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
          stack_trace: error instanceof Error ? error.stack : undefined,
        },
      });
    } catch (logError) {
      console.error(`[PODCAST_GEN] Error logging failed attempt:`, logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger podcast generation'
    };
  }
}
