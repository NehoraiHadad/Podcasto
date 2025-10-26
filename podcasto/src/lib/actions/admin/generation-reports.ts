'use server';

import {
  getDailySummary,
  getAttemptsByPodcast,
  getProblematicPodcasts,
} from '@/lib/db/api/episode-generation-attempts';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import { aggregateStats, calculateAttemptStats, aggregateByStatus, aggregateByField } from '@/lib/utils/stats-calculator';

/**
 * Get daily generation report for a specific date
 * Returns aggregated statistics by status and trigger source
 *
 * Admin-only action
 *
 * @param date - Optional date to fetch report for (defaults to today)
 * @returns Object with success status, daily report data, and optional error
 *
 * @example
 * ```typescript
 * const result = await getGenerationDailyReport(new Date('2025-10-24'));
 * if (result.success) {
 *   console.log(`Total attempts: ${result.data.total}`);
 *   console.log(`Success rate: ${result.data.successRate}%`);
 * }
 * ```
 */
export async function getGenerationDailyReport(date?: Date): Promise<{
  success: boolean;
  data?: {
    date: string;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    rawData: Array<{ status: string; trigger_source: string; count: number }>;
  };
  error?: string;
}> {
  try {
    // Check admin authorization
    await verifyAdminAccess();

    const targetDate = date || new Date();
    console.log(`[ADMIN_REPORTS] Fetching daily report for: ${targetDate.toISOString()}`);

    const summary = await getDailySummary(targetDate);

    if (!summary.success) {
      return {
        success: false,
        error: summary.error || 'Failed to fetch daily summary'
      };
    }

    // Transform data for easier consumption in UI
    const stats = aggregateStats(summary.data || []);

    const report = {
      date: targetDate.toISOString().split('T')[0],
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      successRate: stats.successRate,
      byStatus: aggregateByStatus(summary.data || []),
      bySource: aggregateByField(summary.data || [], 'trigger_source'),
      rawData: summary.data || [],
    };

    console.log(`[ADMIN_REPORTS] Daily report generated: ${report.total} total attempts, ${report.successRate}% success rate`);
    return { success: true, data: report };
  } catch (error) {
    console.error('[ADMIN_REPORTS] Error generating daily report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate daily report'
    };
  }
}

/**
 * Get recent generation attempts for a specific podcast
 * Useful for debugging and monitoring individual podcasts
 *
 * Admin-only action
 *
 * @param podcastId - ID of the podcast to fetch history for
 * @param limit - Maximum number of attempts to return (default: 20)
 * @returns Object with success status, attempts history, and statistics
 *
 * @example
 * ```typescript
 * const result = await getPodcastGenerationHistory('podcast-123', 30);
 * if (result.success) {
 *   console.log(`Recent failure rate: ${result.data.stats.recentFailureRate}%`);
 * }
 * ```
 */
export async function getPodcastGenerationHistory(
  podcastId: string,
  limit: number = 20
): Promise<{
  success: boolean;
  data?: {
    attempts: Array<{
      id: string;
      podcast_id: string;
      episode_id: string | null;
      triggered_by: string | null;
      status: string;
      trigger_source: string;
      content_start_date: Date | null;
      content_end_date: Date | null;
      failure_reason: string | null;
      error_details: Record<string, unknown> | null;
      notification_sent: boolean;
      notification_sent_at: Date | null;
      attempted_at: Date;
      created_at: Date;
    }>;
    stats: {
      total: number;
      successful: number;
      failed: number;
      recentFailureRate: number;
    };
  };
  error?: string;
}> {
  try {
    // Check admin authorization
    await verifyAdminAccess();

    console.log(`[ADMIN_REPORTS] Fetching generation history for podcast: ${podcastId}`);

    const attempts = await getAttemptsByPodcast(podcastId, limit);

    if (!attempts.success) {
      return {
        success: false,
        error: attempts.error || 'Failed to fetch podcast attempts'
      };
    }

    // Calculate statistics using utility function
    const stats = calculateAttemptStats(attempts.data || []);
    const formattedStats = {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      recentFailureRate: 100 - stats.successRate, // Convert success rate to failure rate
    };

    return {
      success: true,
      data: {
        attempts: attempts.data || [],
        stats: formattedStats,
      }
    };
  } catch (error) {
    console.error('[ADMIN_REPORTS] Error fetching podcast history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch podcast history'
    };
  }
}

/**
 * Get list of problematic podcasts
 * Identifies podcasts with consistently high failure rates
 *
 * Admin-only action
 *
 * @param daysBack - Number of days to look back (default: 7)
 * @param minAttempts - Minimum attempts required to be included (default: 3)
 * @param failureThreshold - Minimum failure rate to be considered problematic (default: 0.8)
 * @returns Object with success status and array of problematic podcasts
 *
 * @example
 * ```typescript
 * const result = await getProblematicPodcastsReport(14, 5, 0.7);
 * if (result.success) {
 *   console.log(`Found ${result.data.length} problematic podcasts`);
 * }
 * ```
 */
export async function getProblematicPodcastsReport(
  daysBack: number = 7,
  minAttempts: number = 3,
  failureThreshold: number = 0.8
): Promise<{
  success: boolean;
  data?: Array<{
    podcast_id: string;
    total_attempts: number;
    failed_attempts: number;
    failure_rate: number;
    podcast_title: string;
    created_by: string;
    recent_failure_reason: string | null;
    recent_error_details: Record<string, unknown> | null;
    last_failure_at: Date | null;
  }>;
  error?: string;
}> {
  try {
    // Check admin authorization
    await verifyAdminAccess();

    console.log(`[ADMIN_REPORTS] Fetching problematic podcasts (${daysBack} days, ${failureThreshold * 100}% threshold)`);

    const result = await getProblematicPodcasts(daysBack, minAttempts, failureThreshold);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch problematic podcasts'
      };
    }

    console.log(`[ADMIN_REPORTS] Found ${result.data?.length || 0} problematic podcasts`);
    return result;
  } catch (error) {
    console.error('[ADMIN_REPORTS] Error fetching problematic podcasts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch problematic podcasts'
    };
  }
}

/**
 * Get weekly summary report
 * Aggregates daily data for the past 7 days
 *
 * Admin-only action
 *
 * @returns Object with success status, daily reports, and weekly totals
 *
 * @example
 * ```typescript
 * const result = await getWeeklySummaryReport();
 * if (result.success) {
 *   console.log(`Weekly success rate: ${result.data.weeklyTotals.successRate}%`);
 *   result.data.dailyReports.forEach(day => {
 *     console.log(`${day.date}: ${day.total} attempts`);
 *   });
 * }
 * ```
 */
export async function getWeeklySummaryReport(): Promise<{
  success: boolean;
  data?: {
    dailyReports: Array<{
      date: string;
      total: number;
      successful: number;
      failed: number;
      byStatus: Record<string, number>;
    }>;
    weeklyTotals: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
  };
  error?: string;
}> {
  try {
    // Check admin authorization
    await verifyAdminAccess();

    console.log('[ADMIN_REPORTS] Generating weekly summary report');

    const today = new Date();
    const dailyReports = [];

    // Fetch last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const summary = await getDailySummary(date);
      if (summary.success && summary.data) {
        const dayStats = aggregateStats(summary.data);

        dailyReports.push({
          date: date.toISOString().split('T')[0],
          total: dayStats.total,
          successful: dayStats.successful,
          failed: dayStats.failed,
          byStatus: aggregateByStatus(summary.data),
        });
      }
    }

    // Calculate weekly totals
    const weeklyTotals = {
      total: dailyReports.reduce((sum, day) => sum + day.total, 0),
      successful: dailyReports.reduce((sum, day) => sum + day.successful, 0),
      failed: dailyReports.reduce((sum, day) => sum + day.failed, 0),
      successRate: 0,
    };

    weeklyTotals.successRate = weeklyTotals.total > 0
      ? Math.round((weeklyTotals.successful / weeklyTotals.total) * 10000) / 100
      : 0;

    return {
      success: true,
      data: {
        dailyReports: dailyReports.reverse(), // Oldest to newest
        weeklyTotals,
      }
    };
  } catch (error) {
    console.error('[ADMIN_REPORTS] Error generating weekly summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate weekly summary'
    };
  }
}
