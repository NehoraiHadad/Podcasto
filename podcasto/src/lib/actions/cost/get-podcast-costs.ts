'use server';

import { db } from '@/lib/db';
import { episodeCosts, episodes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface PodcastEpisodeCost {
  episodeId: string;
  episodeTitle: string | null;
  totalCostUsd: string;
  aiCostUsd: string;
  awsCostUsd: string;
  totalTokens: number;
  calculatedAt: Date | null;
}

export interface PodcastCostsSummary {
  totalCostUsd: number;
  totalEpisodes: number;
  avgCostPerEpisode: number;
  mostExpensiveEpisodeId: string | null;
  mostExpensiveCost: number;
  episodes: PodcastEpisodeCost[];
}

export interface GetPodcastCostsResult {
  success: boolean;
  summary?: PodcastCostsSummary;
  error?: string;
}

/**
 * Get aggregated costs for all episodes in a podcast
 * Returns sorted list of episodes with cost breakdowns
 */
export async function getPodcastCosts({
  podcastId,
}: {
  podcastId: string;
}): Promise<GetPodcastCostsResult> {
  try {
    const podcastEpisodes = await db
      .select({
        episodeId: episodes.id,
        episodeTitle: episodes.title,
        totalCostUsd: episodeCosts.total_cost_usd,
        aiTextCost: episodeCosts.ai_text_cost_usd,
        aiImageCost: episodeCosts.ai_image_cost_usd,
        aiTtsCost: episodeCosts.ai_tts_cost_usd,
        lambdaCost: episodeCosts.lambda_execution_cost_usd,
        s3OpsCost: episodeCosts.s3_operations_cost_usd,
        s3StorageCost: episodeCosts.s3_storage_cost_usd,
        emailCost: episodeCosts.email_cost_usd,
        sqsCost: episodeCosts.sqs_cost_usd,
        totalTokens: episodeCosts.total_tokens,
        calculatedAt: episodeCosts.cost_calculated_at,
      })
      .from(episodes)
      .innerJoin(episodeCosts, eq(episodes.id, episodeCosts.episode_id))
      .where(eq(episodes.podcast_id, podcastId))
      .orderBy(desc(episodeCosts.total_cost_usd));

    if (podcastEpisodes.length === 0) {
      return {
        success: true,
        summary: {
          totalCostUsd: 0,
          totalEpisodes: 0,
          avgCostPerEpisode: 0,
          mostExpensiveEpisodeId: null,
          mostExpensiveCost: 0,
          episodes: [],
        },
      };
    }

    // Calculate AI + AWS costs
    const episodesWithBreakdown: PodcastEpisodeCost[] = podcastEpisodes.map((ep) => {
      const aiCost =
        parseFloat(ep.aiTextCost) +
        parseFloat(ep.aiImageCost) +
        parseFloat(ep.aiTtsCost);
      const awsCost =
        parseFloat(ep.lambdaCost) +
        parseFloat(ep.s3OpsCost) +
        parseFloat(ep.s3StorageCost) +
        parseFloat(ep.emailCost) +
        parseFloat(ep.sqsCost);

      return {
        episodeId: ep.episodeId,
        episodeTitle: ep.episodeTitle,
        totalCostUsd: ep.totalCostUsd,
        aiCostUsd: aiCost.toFixed(6),
        awsCostUsd: awsCost.toFixed(6),
        totalTokens: ep.totalTokens,
        calculatedAt: ep.calculatedAt,
      };
    });

    // Calculate summary statistics
    const totalCost = podcastEpisodes.reduce(
      (sum, ep) => sum + parseFloat(ep.totalCostUsd),
      0
    );
    const avgCost = totalCost / podcastEpisodes.length;
    const mostExpensive = podcastEpisodes[0]; // Already sorted by total_cost_usd DESC

    return {
      success: true,
      summary: {
        totalCostUsd: parseFloat(totalCost.toFixed(6)),
        totalEpisodes: podcastEpisodes.length,
        avgCostPerEpisode: parseFloat(avgCost.toFixed(6)),
        mostExpensiveEpisodeId: mostExpensive.episodeId,
        mostExpensiveCost: parseFloat(mostExpensive.totalCostUsd),
        episodes: episodesWithBreakdown,
      },
    };
  } catch (error) {
    console.error('[GET_PODCAST_COSTS] Error fetching podcast costs:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch podcast costs',
    };
  }
}
