'use server';

import { db } from '@/lib/db';
import { episodeGenerationAttempts } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

/**
 * Episode Generation Attempts API
 * Handles all database operations for tracking episode generation attempts
 */

/**
 * Type for logging a generation attempt
 */
export interface LogGenerationAttemptParams {
  podcastId: string;
  episodeId?: string;
  triggeredBy?: string;
  status: 'success' | 'failed_no_messages' | 'failed_insufficient_credits' | 'failed_error';
  triggerSource: 'cron' | 'manual_admin' | 'manual_user' | 'api';
  contentStartDate?: Date;
  contentEndDate?: Date;
  failureReason?: string;
  errorDetails?: {
    error_type?: string;
    error_message?: string;
    channel_name?: string;
    latest_message_date?: string;
    credits_required?: number;
    credits_available?: number;
    stack_trace?: string;
  };
}

/**
 * Generation attempt record returned from database
 */
export interface GenerationAttemptRecord {
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
}

/**
 * Daily summary record for reporting
 */
export interface DailySummaryRecord {
  status: string;
  trigger_source: string;
  count: number;
}

/**
 * Problematic podcast record for monitoring
 */
export interface ProblematicPodcastRecord {
  podcast_id: string;
  total_attempts: number;
  failed_attempts: number;
  failure_rate: number;
  podcast_title: string;
  created_by: string;
}

/**
 * Log an episode generation attempt
 * This function is called after every generation attempt (success or failure)
 * to maintain a complete historical record
 *
 * @param data - Generation attempt parameters
 * @returns Object with success status and created attempt data
 *
 * @example
 * ```typescript
 * const result = await logGenerationAttempt({
 *   podcastId: 'podcast-123',
 *   status: 'success',
 *   triggerSource: 'cron',
 *   episodeId: 'episode-456'
 * });
 * ```
 */
export async function logGenerationAttempt(
  data: LogGenerationAttemptParams
): Promise<{ success: boolean; data?: GenerationAttemptRecord; error?: string }> {
  try {
    console.log('[DB] Logging generation attempt:', {
      podcastId: data.podcastId,
      status: data.status,
      triggerSource: data.triggerSource,
    });

    const [attempt] = await db
      .insert(episodeGenerationAttempts)
      .values({
        podcast_id: data.podcastId,
        episode_id: data.episodeId || null,
        triggered_by: data.triggeredBy || null,
        status: data.status,
        trigger_source: data.triggerSource,
        content_start_date: data.contentStartDate || null,
        content_end_date: data.contentEndDate || null,
        failure_reason: data.failureReason || null,
        error_details: data.errorDetails || null,
        attempted_at: new Date(),
      })
      .returning();

    console.log('[DB] Generation attempt logged successfully:', attempt.id);
    return { success: true, data: attempt as GenerationAttemptRecord };
  } catch (error) {
    console.error('[DB] Error logging generation attempt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error logging attempt',
    };
  }
}

/**
 * Get recent attempts for a specific podcast
 * Useful for showing attempt history in the admin panel
 *
 * @param podcastId - Podcast ID to fetch attempts for
 * @param limit - Maximum number of attempts to return (default: 10)
 * @returns Object with success status and array of attempts
 *
 * @example
 * ```typescript
 * const result = await getAttemptsByPodcast('podcast-123', 20);
 * if (result.success) {
 *   console.log(`Found ${result.data.length} attempts`);
 * }
 * ```
 */
export async function getAttemptsByPodcast(
  podcastId: string,
  limit: number = 10
): Promise<{ success: boolean; data?: GenerationAttemptRecord[]; error?: string }> {
  try {
    const attempts = await db
      .select()
      .from(episodeGenerationAttempts)
      .where(eq(episodeGenerationAttempts.podcast_id, podcastId))
      .orderBy(desc(episodeGenerationAttempts.attempted_at))
      .limit(limit);

    return { success: true, data: attempts as GenerationAttemptRecord[] };
  } catch (error) {
    console.error('[DB] Error fetching attempts for podcast:', podcastId, error);
    return {
      success: false,
      error: 'Failed to fetch generation attempts',
    };
  }
}

/**
 * Get daily summary of attempts grouped by status and trigger source
 * Used for admin reports and monitoring
 *
 * @param date - Date to fetch summary for
 * @returns Object with success status and summary data
 *
 * @example
 * ```typescript
 * const result = await getDailySummary(new Date());
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
  daysBack: number = 7,
  minAttempts: number = 3,
  failureThreshold: number = 0.8
): Promise<{ success: boolean; data?: ProblematicPodcastRecord[]; error?: string }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    console.log('[DB] Fetching problematic podcasts since:', cutoffDate.toISOString());

    // This is a complex query - we'll use raw SQL for clarity and performance
    const results = await db.execute(sql`
      WITH podcast_stats AS (
        SELECT
          podcast_id,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as failed_attempts,
          SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END)::float / COUNT(*) as failure_rate
        FROM episode_generation_attempts
        WHERE attempted_at >= ${cutoffDate}
        GROUP BY podcast_id
        HAVING COUNT(*) >= ${minAttempts}
      )
      SELECT
        ps.podcast_id,
        ps.total_attempts,
        ps.failed_attempts,
        ps.failure_rate,
        p.title as podcast_title,
        p.created_by
      FROM podcast_stats ps
      JOIN podcasts p ON p.id = ps.podcast_id
      WHERE ps.failure_rate >= ${failureThreshold}
      ORDER BY ps.failure_rate DESC, ps.total_attempts DESC
      LIMIT 20
    `);

    // Handle different result formats from db.execute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = Array.isArray(results) ? results : (results as any).rows || [];
    return { success: true, data: rows as ProblematicPodcastRecord[] };
  } catch (error) {
    console.error('[DB] Error fetching problematic podcasts:', error);
    return {
      success: false,
      error: 'Failed to fetch problematic podcasts',
    };
  }
}

/**
 * Mark notification as sent for an attempt
 * Called after successfully sending an email notification
 *
 * @param attemptId - Attempt ID to update
 * @returns Object with success status
 *
 * @example
 * ```typescript
 * const result = await markNotificationSent('attempt-123');
 * if (result.success) {
 *   console.log('Notification marked as sent');
 * }
 * ```
 */
export async function markNotificationSent(
  attemptId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(episodeGenerationAttempts)
      .set({
        notification_sent: true,
        notification_sent_at: new Date(),
      })
      .where(eq(episodeGenerationAttempts.id, attemptId));

    console.log('[DB] Marked notification as sent for attempt:', attemptId);
    return { success: true };
  } catch (error) {
    console.error('[DB] Error marking notification as sent:', error);
    return {
      success: false,
      error: 'Failed to mark notification as sent',
    };
  }
}

/**
 * Get recent failed attempts that haven't been notified yet
 * Useful for batch notification processing
 *
 * @param limit - Maximum number of attempts to return (default: 50)
 * @returns Object with success status and array of unnotified failures
 *
 * @example
 * ```typescript
 * const result = await getUnnotifiedFailures(100);
 * if (result.success) {
 *   console.log(`Found ${result.data.length} unnotified failures`);
 * }
 * ```
 */
export async function getUnnotifiedFailures(
  limit: number = 50
): Promise<{ success: boolean; data?: GenerationAttemptRecord[]; error?: string }> {
  try {
    const failures = await db
      .select()
      .from(episodeGenerationAttempts)
      .where(
        and(
          sql`${episodeGenerationAttempts.status} != 'success'`,
          eq(episodeGenerationAttempts.notification_sent, false),
          sql`${episodeGenerationAttempts.triggered_by} IS NOT NULL` // Only user-triggered
        )
      )
      .orderBy(desc(episodeGenerationAttempts.attempted_at))
      .limit(limit);

    return { success: true, data: failures as GenerationAttemptRecord[] };
  } catch (error) {
    console.error('[DB] Error fetching unnotified failures:', error);
    return {
      success: false,
      error: 'Failed to fetch unnotified failures',
    };
  }
}
