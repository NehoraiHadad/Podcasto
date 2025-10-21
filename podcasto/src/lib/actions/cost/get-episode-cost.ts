'use server';

import { db } from '@/lib/db';
import { episodeCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface EpisodeCostBreakdown {
  totalCostUsd: string;
  aiTextCostUsd: string;
  aiImageCostUsd: string;
  aiTtsCostUsd: string;
  lambdaExecutionCostUsd: string;
  s3OperationsCostUsd: string;
  s3StorageCostUsd: string;
  emailCostUsd: string;
  sqsCostUsd: string;
  totalTokens: number;
  totalEmailsSent: number;
  totalS3Operations: number;
  storageMb: string;
  lambdaDurationSeconds: string;
  costCalculatedAt: Date | null;
}

export interface GetEpisodeCostResult {
  success: boolean;
  breakdown?: EpisodeCostBreakdown;
  error?: string;
}

/**
 * Get cost breakdown for a single episode
 * Returns aggregated cost data from episode_costs table
 */
export async function getEpisodeCost({
  episodeId,
}: {
  episodeId: string;
}): Promise<GetEpisodeCostResult> {
  try {
    const [costRecord] = await db
      .select()
      .from(episodeCosts)
      .where(eq(episodeCosts.episode_id, episodeId))
      .limit(1);

    if (!costRecord) {
      return {
        success: false,
        error: 'No cost data found for this episode',
      };
    }

    return {
      success: true,
      breakdown: {
        totalCostUsd: costRecord.total_cost_usd,
        aiTextCostUsd: costRecord.ai_text_cost_usd,
        aiImageCostUsd: costRecord.ai_image_cost_usd,
        aiTtsCostUsd: costRecord.ai_tts_cost_usd,
        lambdaExecutionCostUsd: costRecord.lambda_execution_cost_usd,
        s3OperationsCostUsd: costRecord.s3_operations_cost_usd,
        s3StorageCostUsd: costRecord.s3_storage_cost_usd,
        emailCostUsd: costRecord.email_cost_usd,
        sqsCostUsd: costRecord.sqs_cost_usd,
        totalTokens: costRecord.total_tokens,
        totalEmailsSent: costRecord.total_emails_sent,
        totalS3Operations: costRecord.total_s3_operations,
        storageMb: costRecord.storage_mb,
        lambdaDurationSeconds: costRecord.lambda_duration_seconds,
        costCalculatedAt: costRecord.cost_calculated_at,
      },
    };
  } catch (error) {
    console.error('[GET_EPISODE_COST] Error fetching episode cost:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch episode cost',
    };
  }
}
