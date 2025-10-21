'use server';

import { getUser } from '@/lib/auth';
import { creditService } from '@/lib/services/credits';
import { generatePodcastEpisode } from '../podcast/generate';
import { podcastsApi } from '@/lib/db/api';
import { checkIsAdmin } from '../admin/auth-actions';
import type { DateRange, GenerationResult } from '../podcast/generation/types';
import type { ActionResult } from '../shared/types';

/**
 * Generate episode with credit validation and deduction
 * This is the user-facing action that checks and deducts credits before generating
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

    // Check if user is admin (admins bypass credit checks)
    const { isAdmin } = await checkIsAdmin({ redirectOnFailure: false });

    if (!isAdmin) {
      // Regular users: Check if podcast belongs to user
      const podcast = await podcastsApi.getPodcastById(podcastId);
      if (!podcast) {
        return {
          success: false,
          error: 'Podcast not found'
        };
      }

      if (podcast.created_by !== user.id) {
        return {
          success: false,
          error: 'You can only generate episodes for your own podcasts'
        };
      }

      // Check if user has enough credits
      const creditCheck = await creditService.checkCreditsForEpisode(user.id);
      if (!creditCheck.hasEnough) {
        return {
          success: false,
          error: `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}. Please purchase more credits.`
        };
      }
    }

    // Generate the episode
    const result = await generatePodcastEpisode(podcastId, dateRange);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to generate episode'
      };
    }

    // For non-admin users: Deduct credits after successful generation
    if (!isAdmin && result.episodeId) {
      const deductionResult = await creditService.deductCreditsForEpisode(
        user.id,
        result.episodeId,
        podcastId
      );

      if (!deductionResult.success) {
        console.error('[generateEpisodeWithCreditsAction] Failed to deduct credits:', deductionResult.error);
        // Note: Episode was already created, so we log the error but don't fail
        // This is a business decision - you might want to handle this differently
      } else {
        console.log(`[generateEpisodeWithCreditsAction] Deducted credits for user ${user.id}, new balance: ${deductionResult.newBalance}`);
      }
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[generateEpisodeWithCreditsAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate episode'
    };
  }
}
