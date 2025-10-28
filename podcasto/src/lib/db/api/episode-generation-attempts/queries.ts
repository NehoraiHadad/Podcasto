'use server';

import 'server-only';

import { nowUTC } from '@/lib/utils/date/server';

import { db } from '@/lib/db';
import { episodeGenerationAttempts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { LogGenerationAttemptParams, GenerationAttemptRecord } from './types';

/**
 * Episode Generation Attempts API
 * Handles all database operations for tracking episode generation attempts
 */

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
        attempted_at: nowUTC(),
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
