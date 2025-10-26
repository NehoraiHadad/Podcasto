'use server';

import { nowUTC } from '@/lib/utils/date/server';

import { db } from '@/lib/db';
import { episodeGenerationAttempts } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { EPISODE_CONSTANTS } from '@/lib/constants/episode-constants';
import type { GenerationAttemptRecord } from './types';

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
        notification_sent_at: nowUTC(),
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
  limit: number = EPISODE_CONSTANTS.DEFAULT_ATTEMPT_LIMIT
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
