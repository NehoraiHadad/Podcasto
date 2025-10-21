'use server';

import { db } from '@/lib/db';
import { dailyCostSummary } from '@/lib/db/schema';
import { desc, gte, lte, and } from 'drizzle-orm';

export interface DailyCostSummaryRecord {
  date: string;
  totalEpisodesProcessed: number;
  totalCostUsd: string;
  aiCostUsd: string;
  lambdaCostUsd: string;
  storageCostUsd: string;
  emailCostUsd: string;
  otherCostUsd: string;
  avgCostPerEpisodeUsd: string;
  maxEpisodeCostUsd: string;
  mostExpensiveEpisodeId: string | null;
}

export interface GetDailySummaryResult {
  success: boolean;
  summaries?: DailyCostSummaryRecord[];
  totalCostUsd?: number;
  totalEpisodes?: number;
  error?: string;
}

/**
 * Get daily cost summaries for a date range
 * Defaults to last 30 days if no range specified
 */
export async function getDailySummary({
  startDate,
  endDate,
}: {
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<GetDailySummaryResult> {
  try {
    // Default to last 30 days
    const defaultEndDate = endDate || new Date();
    const defaultStartDate =
      startDate ||
      new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Convert dates to YYYY-MM-DD format for SQL date comparison
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const startDateStr = formatDate(defaultStartDate);
    const endDateStr = formatDate(defaultEndDate);

    const conditions = [];
    if (startDate || !startDate) {
      conditions.push(gte(dailyCostSummary.date, startDateStr));
    }
    if (endDate || !startDate) {
      conditions.push(lte(dailyCostSummary.date, endDateStr));
    }

    const summaries = await db
      .select()
      .from(dailyCostSummary)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(dailyCostSummary.date));

    if (summaries.length === 0) {
      return {
        success: true,
        summaries: [],
        totalCostUsd: 0,
        totalEpisodes: 0,
      };
    }

    // Calculate aggregates across all days
    const totalCost = summaries.reduce(
      (sum, day) => sum + parseFloat(day.total_cost_usd),
      0
    );
    const totalEpisodes = summaries.reduce(
      (sum, day) => sum + day.total_episodes_processed,
      0
    );

    return {
      success: true,
      summaries: summaries.map((s) => ({
        date: s.date,
        totalEpisodesProcessed: s.total_episodes_processed,
        totalCostUsd: s.total_cost_usd,
        aiCostUsd: s.ai_cost_usd,
        lambdaCostUsd: s.lambda_cost_usd,
        storageCostUsd: s.storage_cost_usd,
        emailCostUsd: s.email_cost_usd,
        otherCostUsd: s.other_cost_usd,
        avgCostPerEpisodeUsd: s.avg_cost_per_episode_usd,
        maxEpisodeCostUsd: s.max_episode_cost_usd,
        mostExpensiveEpisodeId: s.most_expensive_episode_id,
      })),
      totalCostUsd: parseFloat(totalCost.toFixed(6)),
      totalEpisodes,
    };
  } catch (error) {
    console.error('[GET_DAILY_SUMMARY] Error fetching daily summaries:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch daily summaries',
    };
  }
}
