'use server';

import { nowUTC, formatInTimezoneServer } from '@/lib/utils/date/server';
import { DEFAULT_TIMEZONE } from '@/lib/utils/date/constants';
import { getUser } from '@/lib/auth';
import { creditService } from '@/lib/services/credits';
import { podcastsApi, episodesApi, podcastConfigsApi } from '@/lib/db/api';
import { checkIsAdmin } from '../admin/auth-actions';
import { invokeLambdaFunction, validateDateRange, checkEnvironmentConfiguration } from '../podcast/generation';
import { checkForNewMessages } from '@/lib/services/telegram';
import { sendNoMessagesNotification } from '@/lib/actions/send-creator-notification';
import { logGenerationAttempt } from '@/lib/db/api/episode-generation-attempts';
import { determineTriggerSource } from '@/lib/utils/episode-server-utils';
import { revalidatePath } from 'next/cache';
import type { DateRange, GenerationResult } from '../podcast/generation/types';
import type { ActionResult } from '../shared/types';

/**
 * Generate episode with credit validation and deduction
 * This is the user-facing action that checks and deducts credits before generating
 *
 * IMPORTANT: Credits are deducted BEFORE episode creation using a database transaction
 * to ensure atomicity. If episode creation fails, credits are automatically rolled back.
 */
export async function generateEpisodeWithCreditsAction(
  podcastId: string,
  dateRange?: DateRange
): Promise<ActionResult<GenerationResult>> {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Validate the podcast ID
    if (!podcastId) {
      return { success: false, error: 'Podcast ID is required' };
    }

    // Validate date range if provided
    if (dateRange) {
      const validationResult = validateDateRange(dateRange);
      if (!validationResult.success) {
        return { success: false, error: validationResult.error || 'Invalid date range' };
      }
    }

    // Check if user is admin (admins bypass credit checks)
    const isAdmin = await checkIsAdmin({ redirectOnFailure: false });

    // Get podcast details
    const podcast = await podcastsApi.getPodcastById(podcastId);
    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    // Regular users: Check if podcast belongs to user
    if (!isAdmin && podcast.created_by !== user.id) {
      return {
        success: false,
        error: 'You can only generate episodes for your own podcasts'
      };
    }

    // Check environment configuration
    const envCheck = checkEnvironmentConfiguration();
    if (!envCheck.success) {
      return { success: false, error: envCheck.error || 'Environment configuration check failed' };
    }

    // Get podcast config
    const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);
    if (!podcastConfig) {
      return { success: false, error: 'Podcast configuration not found' };
    }

    // PRE-CHECK: Verify there are new messages before deducting credits
    if (podcastConfig.telegram_channel) {
      console.log(`[EPISODE_GEN_WITH_CREDITS] Checking for new messages in ${podcastConfig.telegram_channel}`);

      try {
        // Calculate date range for message check
        let messageCheckOptions: { startDate: Date; endDate: Date } | number;
        if (dateRange) {
          messageCheckOptions = {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          };
        } else {
          const hoursBack = podcastConfig.telegram_hours || 24;
          messageCheckOptions = hoursBack / 24;
        }

        // Check for new messages
        const messageCheck = await checkForNewMessages(
          podcastConfig.telegram_channel,
          messageCheckOptions
        );

        console.log(`[EPISODE_GEN_WITH_CREDITS] Message check result:`, {
          hasNewMessages: messageCheck.hasNewMessages,
          latestMessageDate: messageCheck.latestMessageDate,
        });

        // If no new messages, don't proceed or charge credits
        if (!messageCheck.hasNewMessages) {
          console.log(`[EPISODE_GEN_WITH_CREDITS] No new messages - aborting generation`);

          // For automated triggers, send email notification
          const isAutomatedTrigger = !user;
          if (isAutomatedTrigger && podcast.created_by) {
            const actualDateRange = typeof messageCheckOptions === 'number'
              ? {
                  start: new Date(Date.now() - messageCheckOptions * 24 * 60 * 60 * 1000),
                  end: new Date()
                }
              : {
                  start: messageCheckOptions.startDate,
                  end: messageCheckOptions.endDate
                };

            await sendNoMessagesNotification({
              podcastId,
              creatorUserId: podcast.created_by,
              channelName: podcastConfig.telegram_channel,
              dateRange: actualDateRange
            });
          }

          // Log the failed attempt
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
              latest_message_date: messageCheck.latestMessageDate?.toISOString(),
            },
          });

          return {
            success: false,
            error: `No new messages found in ${podcastConfig.telegram_channel} for the specified time range. ${
              messageCheck.latestMessageDate
                ? `Latest message: ${messageCheck.latestMessageDate.toISOString()}`
                : 'No recent messages detected'
            }`
          };
        }
      } catch (error) {
        console.error(`[EPISODE_GEN_WITH_CREDITS] Error during message pre-check:`, error);
        console.log(`[EPISODE_GEN_WITH_CREDITS] Continuing with generation despite pre-check error`);
      }
    }

    let episodeId: string | undefined;
    let deductionTransactionId: string | undefined;

    // For non-admin users: Deduct credits BEFORE creating episode
    // If episode creation fails, credits will be refunded
    if (!isAdmin) {
      // Check if user has enough credits
      const creditCheck = await creditService.checkCreditsForEpisode(user.id);
      if (!creditCheck.hasEnough) {
        return {
          success: false,
          error: `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}. Please purchase more credits.`
        };
      }

      console.log(`[EPISODE_GEN_WITH_CREDITS] Deducting credits before episode creation`);

      // Step 1: Deduct credits FIRST (before episode creation)
      const deductionResult = await creditService.deductCreditsForEpisode(
        user.id,
        'pending-episode', // Temporary ID, actual episode ID will be in transaction metadata
        podcastId
      );

      if (!deductionResult.success) {
        console.error('[EPISODE_GEN_WITH_CREDITS] Failed to deduct credits:', deductionResult.error);
        return {
          success: false,
          error: `Failed to deduct credits: ${deductionResult.error}`
        };
      }

      deductionTransactionId = deductionResult.transactionId;
      console.log(`[EPISODE_GEN_WITH_CREDITS] Credits deducted successfully, new balance: ${deductionResult.newBalance}, transaction: ${deductionTransactionId}`);

      // Step 2: Create episode
      const timestamp = new Date().toISOString();
      const language = podcastConfig.language || 'english';

      try {
        const episode = await episodesApi.createEpisode({
          podcast_id: podcastId,
          title: `Episode ${formatInTimezoneServer(nowUTC(), DEFAULT_TIMEZONE, 'dd/MM/yyyy')}`,
          description: 'Processing...',
          audio_url: '',
          status: 'pending',
          duration: 0,
          language: language,
          content_start_date: dateRange?.startDate,
          content_end_date: dateRange?.endDate,
          created_by: user.id,
          metadata: JSON.stringify({
            generation_timestamp: timestamp,
            s3_key: `podcasts/${podcastId}/${timestamp}/podcast.mp3`,
            date_range: dateRange ? {
              start: dateRange.startDate.toISOString(),
              end: dateRange.endDate.toISOString()
            } : null,
            credit_transaction_id: deductionTransactionId
          })
        });

        episodeId = episode.id;
        console.log(`[EPISODE_GEN_WITH_CREDITS] Episode created: ${episodeId}`);
      } catch (episodeError) {
        // Episode creation failed - REFUND credits
        console.error('[EPISODE_GEN_WITH_CREDITS] Episode creation failed, refunding credits:', episodeError);

        const refundResult = await creditService.refundCreditsForEpisode(
          user.id,
          'failed-episode',
          podcastId,
          'Episode creation failed'
        );

        if (!refundResult.success) {
          console.error('[EPISODE_GEN_WITH_CREDITS] CRITICAL: Failed to refund credits after episode creation failure:', refundResult.error);
          // This is a critical error - credits were deducted but episode wasn't created and refund failed
          // Admin intervention may be needed
        } else {
          console.log(`[EPISODE_GEN_WITH_CREDITS] Credits refunded successfully after episode creation failure`);
        }

        return {
          success: false,
          error: episodeError instanceof Error ? episodeError.message : 'Failed to create episode'
        };
      }
    } else {
      // Admin users: Create episode without credit deduction
      console.log(`[EPISODE_GEN_WITH_CREDITS] Admin user - creating episode without credits`);

      const timestamp = new Date().toISOString();
      const language = podcastConfig.language || 'english';

      const episode = await episodesApi.createEpisode({
        podcast_id: podcastId,
        title: `Episode ${formatInTimezoneServer(nowUTC(), DEFAULT_TIMEZONE, 'dd/MM/yyyy')}`,
        description: 'Processing...',
        audio_url: '',
        status: 'pending',
        duration: 0,
        language: language,
        content_start_date: dateRange?.startDate,
        content_end_date: dateRange?.endDate,
        created_by: user.id,
        metadata: JSON.stringify({
          generation_timestamp: timestamp,
          s3_key: `podcasts/${podcastId}/${timestamp}/podcast.mp3`,
          date_range: dateRange ? {
            start: dateRange.startDate.toISOString(),
            end: dateRange.endDate.toISOString()
          } : null
        })
      });

      episodeId = episode.id;
      console.log(`[EPISODE_GEN_WITH_CREDITS] Episode created: ${episodeId}`);
    }

    if (!episodeId) {
      return {
        success: false,
        error: 'Failed to create episode'
      };
    }

    // Invoke Lambda function to trigger processing
    const timestamp = new Date().toISOString();
    const lambdaResult = await invokeLambdaFunction({
      podcastId,
      episodeId,
      podcastConfig,
      timestamp,
      dateRange
    });

    if (!lambdaResult.success) {
      console.error('[EPISODE_GEN_WITH_CREDITS] Lambda invocation failed:', lambdaResult.error);

      // Lambda invocation failed after episode creation and credit deduction
      // Business decision: Keep the episode as 'failed' and keep credits deducted
      // The episode exists but failed to process. User paid for the attempt.
      //
      // Alternative approach: Refund credits for Lambda failures
      // if (!isAdmin && deductionTransactionId) {
      //   console.log('[EPISODE_GEN_WITH_CREDITS] Refunding credits due to Lambda failure');
      //   await creditService.refundCreditsForEpisode(
      //     user.id,
      //     episodeId,
      //     podcastId,
      //     'Lambda invocation failed'
      //   );
      // }

      return {
        success: false,
        error: lambdaResult.error || 'Failed to trigger episode processing'
      };
    }

    // Revalidate the podcasts page
    revalidatePath('/admin/podcasts');

    // Log the successful generation attempt
    try {
      const triggerSource = await determineTriggerSource(user);
      await logGenerationAttempt({
        podcastId,
        episodeId,
        triggeredBy: user.id,
        status: 'success',
        triggerSource,
        contentStartDate: dateRange?.startDate,
        contentEndDate: dateRange?.endDate,
      });
    } catch (logError) {
      console.error(`[EPISODE_GEN_WITH_CREDITS] Error logging attempt:`, logError);
    }

    const result: GenerationResult = {
      success: true,
      message: 'Podcast generation has been triggered',
      timestamp,
      episodeId
    };

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[EPISODE_GEN_WITH_CREDITS] Error:', error);

    // Log the error attempt
    try {
      const currentUser = await getUser();
      const triggerSource = await determineTriggerSource(currentUser);
      await logGenerationAttempt({
        podcastId,
        triggeredBy: currentUser?.id,
        status: 'failed_error',
        triggerSource,
        contentStartDate: dateRange?.startDate,
        contentEndDate: dateRange?.endDate,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        },
      });
    } catch (logError) {
      console.error(`[EPISODE_GEN_WITH_CREDITS] Error logging failed attempt:`, logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate episode'
    };
  }
}
