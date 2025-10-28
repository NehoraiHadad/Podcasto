import {
  getUserCredits,
  addCreditsToUser,
  deductCreditsFromUser,
  refundCreditsToUser,
  hasEnoughCredits,
  getOrCreateUserCredits,
  createCreditTransaction,
  type TransactionType
} from '@/lib/db/api/credits';
import { PRICING } from '@/lib/config/pricing';

/**
 * Credit Service
 * Business logic layer for managing user credits
 */

export interface CreditCheckResult {
  hasEnough: boolean;
  available: number;
  required: number;
  deficit?: number;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
  error?: string;
}

export interface CreditAdditionResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
  error?: string;
}

export class CreditService {
  /**
   * Check if user has enough credits for episode generation
   */
  async checkCreditsForEpisode(userId: string): Promise<CreditCheckResult> {
    const required = PRICING.EPISODE_GENERATION_COST;
    const hasEnough = await hasEnoughCredits(userId, required);

    const credits = await getUserCredits(userId);
    const available = credits ? parseFloat(credits.available_credits) : 0;

    return {
      hasEnough,
      available,
      required,
      ...(! hasEnough && { deficit: required - available })
    };
  }

  /**
   * Deduct credits for episode generation
   * Creates a transaction record and updates user balance
   */
  async deductCreditsForEpisode(
    userId: string,
    episodeId: string,
    podcastId: string
  ): Promise<CreditDeductionResult> {
    try {
      const cost = PRICING.EPISODE_GENERATION_COST;

      // Check if user has enough credits
      const check = await this.checkCreditsForEpisode(userId);
      if (!check.hasEnough) {
        return {
          success: false,
          newBalance: check.available,
          transactionId: '',
          error: `Insufficient credits. Required: ${cost}, Available: ${check.available}`
        };
      }

      // Deduct credits
      const updated = await deductCreditsFromUser(userId, cost.toString());

      // Create transaction record
      const transaction = await createCreditTransaction({
        user_id: userId,
        amount: `-${cost}`,
        transaction_type: 'usage',
        balance_after: updated.available_credits,
        episode_id: episodeId,
        podcast_id: podcastId,
        description: `Episode generation cost`,
        metadata: {
          episode_id: episodeId,
          podcast_id: podcastId,
          cost
        }
      });

      return {
        success: true,
        newBalance: parseFloat(updated.available_credits),
        transactionId: transaction.id
      };
    } catch (error) {
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to deduct credits'
      };
    }
  }

  /**
   * Add credits to user account (purchase, bonus, subscription)
   */
  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditAdditionResult> {
    try {
      const isFreeCredits = type === 'bonus';

      // Add credits
      const updated = await addCreditsToUser(userId, amount.toString(), isFreeCredits);

      // Create transaction record
      const transaction = await createCreditTransaction({
        user_id: userId,
        amount: amount.toString(),
        transaction_type: type,
        balance_after: updated.available_credits,
        description: description || `Credits added: ${type}`,
        metadata: metadata || {}
      });

      return {
        success: true,
        newBalance: parseFloat(updated.available_credits),
        transactionId: transaction.id
      };
    } catch (error) {
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to add credits'
      };
    }
  }

  /**
   * Initialize credits for new user
   * Grants free credits on signup
   */
  async initializeUserCredits(userId: string): Promise<CreditAdditionResult> {
    try {
      const freeCredits = PRICING.FREE_CREDITS_ON_SIGNUP;

      // Create credits record with free credits
      const credits = await getOrCreateUserCredits(userId, freeCredits.toString());

      // Create transaction record
      const transaction = await createCreditTransaction({
        user_id: userId,
        amount: freeCredits.toString(),
        transaction_type: 'bonus',
        balance_after: credits.available_credits,
        description: 'Welcome bonus - free credits',
        metadata: {
          signup_bonus: true,
          amount: freeCredits
        }
      });

      return {
        success: true,
        newBalance: parseFloat(credits.available_credits),
        transactionId: transaction.id
      };
    } catch (error) {
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to initialize credits'
      };
    }
  }

  /**
   * Get user credit balance
   */
  async getUserBalance(userId: string): Promise<number> {
    const credits = await getUserCredits(userId);
    return credits ? parseFloat(credits.available_credits) : 0;
  }

  /**
   * Calculate cost for episode generation
   */
  calculateEpisodeCost(): number {
    return PRICING.EPISODE_GENERATION_COST;
  }

  /**
   * Refund credits for a failed episode generation
   * Creates a refund transaction record and updates user balance
   * Used for rollback scenarios when episode creation fails after credit deduction
   */
  async refundCreditsForEpisode(
    userId: string,
    episodeId: string,
    podcastId: string,
    reason: string
  ): Promise<CreditAdditionResult> {
    try {
      const cost = PRICING.EPISODE_GENERATION_COST;

      // Refund credits
      const updated = await refundCreditsToUser(userId, cost.toString());

      // Create refund transaction record
      const transaction = await createCreditTransaction({
        user_id: userId,
        amount: cost.toString(),
        transaction_type: 'refund',
        balance_after: updated.available_credits,
        episode_id: episodeId,
        podcast_id: podcastId,
        description: `Refund: ${reason}`,
        metadata: {
          episode_id: episodeId,
          podcast_id: podcastId,
          cost,
          refund_reason: reason
        }
      });

      return {
        success: true,
        newBalance: parseFloat(updated.available_credits),
        transactionId: transaction.id
      };
    } catch (error) {
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to refund credits'
      };
    }
  }
}

// Export singleton instance
export const creditService = new CreditService();
