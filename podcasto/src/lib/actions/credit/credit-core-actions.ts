'use server';

import { creditService, type EnsureSignupCreditsResult } from '@/lib/services/credits';
import { getUserCredits, getUserTransactionHistory } from '@/lib/db/api/credits';
import type { ActionResult } from '../shared/types';
import { getUser } from '@/lib/auth';

/**
 * Credit Core Actions
 * Server actions for managing user credits
 */

export interface UserCreditsData {
  total_credits: number;
  used_credits: number;
  available_credits: number;
  free_credits: number;
  last_purchase_at: Date | null;
}

export interface TransactionData {
  id: string;
  amount: number;
  type: string;
  balance_after: number;
  description: string | null;
  episode_id: string | null;
  podcast_id: string | null;
  created_at: Date;
}

/**
 * Get current user's credit balance and details
 */
export async function getUserCreditsAction(): Promise<ActionResult<UserCreditsData>> {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const credits = await getUserCredits(user.id);

    if (!credits) {
      // User doesn't have credits yet - initialize with free credits
      const initResult = await creditService.initializeUserCredits(user.id);

      if (!initResult.success) {
        return {
          success: false,
          error: initResult.error || 'Failed to initialize credits'
        };
      }

      // Fetch newly created credits
      const newCredits = await getUserCredits(user.id);
      if (!newCredits) {
        return {
          success: false,
          error: 'Failed to retrieve credits after initialization'
        };
      }

      return {
        success: true,
        data: {
          total_credits: parseFloat(newCredits.total_credits),
          used_credits: parseFloat(newCredits.used_credits),
          available_credits: parseFloat(newCredits.available_credits),
          free_credits: parseFloat(newCredits.free_credits),
          last_purchase_at: newCredits.last_purchase_at
        }
      };
    }

    return {
      success: true,
      data: {
        total_credits: parseFloat(credits.total_credits),
        used_credits: parseFloat(credits.used_credits),
        available_credits: parseFloat(credits.available_credits),
        free_credits: parseFloat(credits.free_credits),
        last_purchase_at: credits.last_purchase_at
      }
    };
  } catch (error) {
    console.error('[getUserCreditsAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user credits'
    };
  }
}

/**
 * Get transaction history for current user
 */
export async function getTransactionHistoryAction(
  limit: number = 50
): Promise<ActionResult<TransactionData[]>> {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const transactions = await getUserTransactionHistory(user.id, limit);

    return {
      success: true,
      data: transactions.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        type: t.transaction_type,
        balance_after: parseFloat(t.balance_after),
        description: t.description,
        episode_id: t.episode_id,
        podcast_id: t.podcast_id,
        created_at: t.created_at
      }))
    };
  } catch (error) {
    console.error('[getTransactionHistoryAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction history'
    };
  }
}

/**
 * Check if user has enough credits for episode generation
 */
export async function checkCreditsForEpisodeAction(): Promise<
  ActionResult<{
    hasEnough: boolean;
    available: number;
    required: number;
    deficit?: number;
  }>
> {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const result = await creditService.checkCreditsForEpisode(user.id);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[checkCreditsForEpisodeAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check credits'
    };
  }
}

/**
 * Get episode generation cost
 */
export async function getEpisodeCostAction(): Promise<ActionResult<number>> {
  try {
    const cost = creditService.calculateEpisodeCost();

    return {
      success: true,
      data: cost
    };
  } catch (error) {
    console.error('[getEpisodeCostAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get episode cost'
    };
  }
}

export async function ensureSignupCredits(userId: string): Promise<EnsureSignupCreditsResult> {
  return creditService.ensureSignupCredits(userId);
}
