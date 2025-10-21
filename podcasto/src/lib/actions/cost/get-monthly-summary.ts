'use server';

import { db } from '@/lib/db';
import { monthlyCostSummary } from '@/lib/db/schema';
import { and, eq, gte, lte, desc } from 'drizzle-orm';

export interface MonthlyCostSummaryRecord {
  year: number;
  month: number;
  totalEpisodes: number;
  totalPodcastsActive: number;
  totalCostUsd: string;
  aiTotalUsd: string;
  lambdaTotalUsd: string;
  storageTotalUsd: string;
  emailTotalUsd: string;
  otherTotalUsd: string;
  podcastCosts: Array<{
    podcast_id: string;
    episode_count: number;
    total_cost_usd: number;
  }> | null;
}

export interface GetMonthlySummaryResult {
  success: boolean;
  summaries?: MonthlyCostSummaryRecord[];
  totalCostUsd?: number;
  totalEpisodes?: number;
  error?: string;
}

/**
 * Get monthly cost summaries
 * Can filter by year and/or month
 * Defaults to last 12 months if no filters
 */
export async function getMonthlySummary({
  year,
  month,
  startYear,
  endYear,
}: {
  year?: number;
  month?: number;
  startYear?: number;
  endYear?: number;
} = {}): Promise<GetMonthlySummaryResult> {
  try {
    const conditions = [];

    // Filter by specific year/month
    if (year && month) {
      conditions.push(eq(monthlyCostSummary.year, year));
      conditions.push(eq(monthlyCostSummary.month, month));
    } else if (year) {
      conditions.push(eq(monthlyCostSummary.year, year));
    } else if (startYear && endYear) {
      conditions.push(gte(monthlyCostSummary.year, startYear));
      conditions.push(lte(monthlyCostSummary.year, endYear));
    } else if (startYear) {
      conditions.push(gte(monthlyCostSummary.year, startYear));
    } else if (endYear) {
      conditions.push(lte(monthlyCostSummary.year, endYear));
    }

    const summaries = await db
      .select()
      .from(monthlyCostSummary)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(monthlyCostSummary.year), desc(monthlyCostSummary.month));

    if (summaries.length === 0) {
      return {
        success: true,
        summaries: [],
        totalCostUsd: 0,
        totalEpisodes: 0,
      };
    }

    // Calculate aggregates
    const totalCost = summaries.reduce(
      (sum, m) => sum + parseFloat(m.total_cost_usd),
      0
    );
    const totalEpisodes = summaries.reduce(
      (sum, m) => sum + m.total_episodes,
      0
    );

    return {
      success: true,
      summaries: summaries.map((s) => ({
        year: s.year,
        month: s.month,
        totalEpisodes: s.total_episodes,
        totalPodcastsActive: s.total_podcasts_active,
        totalCostUsd: s.total_cost_usd,
        aiTotalUsd: s.ai_total_usd,
        lambdaTotalUsd: s.lambda_total_usd,
        storageTotalUsd: s.storage_total_usd,
        emailTotalUsd: s.email_total_usd,
        otherTotalUsd: s.other_total_usd,
        podcastCosts: s.podcast_costs,
      })),
      totalCostUsd: parseFloat(totalCost.toFixed(6)),
      totalEpisodes,
    };
  } catch (error) {
    console.error('[GET_MONTHLY_SUMMARY] Error fetching monthly summaries:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch monthly summaries',
    };
  }
}
