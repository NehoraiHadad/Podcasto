'use server';

import 'server-only';

import { nowUTC } from '@/lib/utils/date/server';

import { db } from '@/lib/db';
import { episodeGenerationAttempts } from '@/lib/db/schema';
import { and, gte, lte, sql } from 'drizzle-orm';
import { EPISODE_CONSTANTS } from '@/lib/constants/episode-constants';
import { extractRowsFromSqlResult } from '@/lib/db/utils/sql-result-handler';
import type { DailySummaryRecord, ProblematicPodcastRecord } from './types';

/**
 * Get daily summary of attempts grouped by status and trigger source
 * Used for admin reports and monitoring
 *
 * @param date - Date to fetch summary for
 * @returns Object with success status and summary data
 *
 * @example
 * ```typescript
 * const result = await getDailySummary(nowUTC());
 * if (result.success) {
 *   result.data.forEach(item => {
 *     console.log(`${item.status} (${item.trigger_source}): ${item.count}`);
 *   });
 * }
 * ```
 */
export async function getDailySummary(
  date: Date
): Promise<{ success: boolean; data?: DailySummaryRecord[]; error?: string }> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('[DB] Fetching daily summary for:', startOfDay.toISOString());

    const summary = await db
      .select({
        status: episodeGenerationAttempts.status,
        trigger_source: episodeGenerationAttempts.trigger_source,
        count: sql<number>`count(*)::int`,
      })
      .from(episodeGenerationAttempts)
      .where(
        and(
          gte(episodeGenerationAttempts.attempted_at, startOfDay),
          lte(episodeGenerationAttempts.attempted_at, endOfDay)
        )
      )
      .groupBy(
        episodeGenerationAttempts.status,
        episodeGenerationAttempts.trigger_source
      );

    return { success: true, data: summary as DailySummaryRecord[] };
  } catch (error) {
    console.error('[DB] Error fetching daily summary:', error);
    return {
      success: false,
      error: 'Failed to fetch daily summary',
    };
  }
}

/**
 * Get podcasts that are consistently failing
 * Returns podcasts with high failure rates in recent attempts
 *
 * @param daysBack - Number of days to look back (default: 7)
 * @param minAttempts - Minimum attempts required to be included (default: 3)
 * @param failureThreshold - Minimum failure rate to be considered problematic (default: 0.8)
 * @returns Object with success status and array of problematic podcasts
 *
 * @example
 * ```typescript
 * const result = await getProblematicPodcasts(7, 3, 0.8);
 * if (result.success) {
 *   result.data.forEach(podcast => {
 *     console.log(`${podcast.podcast_title}: ${podcast.failure_rate * 100}% failure rate`);
 *   });
 * }
 * ```
 */
export async function getProblematicPodcasts(
  daysBack: number = EPISODE_CONSTANTS.DEFAULT_DAYS_BACK,
  minAttempts: number = EPISODE_CONSTANTS.DEFAULT_MIN_ATTEMPTS,
  failureThreshold: number = EPISODE_CONSTANTS.DEFAULT_FAILURE_THRESHOLD
): Promise<{ success: boolean; data?: ProblematicPodcastRecord[]; error?: string }> {
  try {
    const cutoffDate = nowUTC();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffDateString = cutoffDate.toISOString();

    console.log('[DB] Fetching problematic podcasts since:', cutoffDateString);
    console.log('[DB] Parameters:', { daysBack, minAttempts, failureThreshold });

    // This is a complex query - we'll use raw SQL for clarity and performance
    const results = await db.execute(sql`
      WITH podcast_stats AS (
        SELECT
          podcast_id,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as failed_attempts,
          SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END)::float / COUNT(*) as failure_rate
        FROM episode_generation_attempts
        WHERE attempted_at >= ${cutoffDateString}
        GROUP BY podcast_id
        HAVING COUNT(*) >= ${minAttempts}
      ),
      latest_failures AS (
        SELECT DISTINCT ON (podcast_id)
          podcast_id,
          failure_reason,
          error_details,
          attempted_at as last_failure_at
        FROM episode_generation_attempts
        WHERE
          attempted_at >= ${cutoffDateString}
          AND status != 'success'
        ORDER BY podcast_id, attempted_at DESC
      )
      SELECT
        ps.podcast_id,
        ps.total_attempts,
        ps.failed_attempts,
        ps.failure_rate,
        p.title as podcast_title,
        p.created_by,
        lf.failure_reason as recent_failure_reason,
        lf.error_details as recent_error_details,
        lf.last_failure_at
      FROM podcast_stats ps
      JOIN podcasts p ON p.id = ps.podcast_id
      LEFT JOIN latest_failures lf ON lf.podcast_id = ps.podcast_id
      WHERE ps.failure_rate >= ${failureThreshold}
      ORDER BY ps.failure_rate DESC, ps.total_attempts DESC
      LIMIT 20
    `);

    // Log the raw result for debugging
    console.log('[DB] Raw SQL result type:', typeof results, 'isArray:', Array.isArray(results));
    console.log('[DB] Raw SQL result:', JSON.stringify(results, null, 2));

    // Extract rows using utility function
    const rows = extractRowsFromSqlResult<ProblematicPodcastRecord>(
      results,
      'ProblematicPodcasts'
    );

    console.log('[DB] Found problematic podcasts:', rows.length);

    return { success: true, data: rows };
  } catch (error) {
    console.error('[DB] Error fetching problematic podcasts:', error);
    console.error('[DB] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[DB] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return {
      success: false,
      error: `Failed to fetch problematic podcasts: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
