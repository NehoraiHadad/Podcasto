/**
 * Database updater for podcast format sequence state
 */

import { db } from '@/lib/db';
import { podcastConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { FormatDeterminationResult } from './types';

/**
 * Updates podcast config with new sequence state if needed
 * Only updates when sequence_state is present in the result
 *
 * @param podcastId - The podcast ID to update
 * @param result - Format determination result with optional sequence_state
 * @returns Promise that resolves when update is complete
 */
export async function updateSequenceStateIfNeeded(
  podcastId: string,
  result: FormatDeterminationResult
): Promise<void> {
  // Only update if sequence state is present
  if (!result.sequence_state) {
    return;
  }

  const { next_type, next_progress } = result.sequence_state;

  try {
    await db
      .update(podcastConfigs)
      .set({
        sequence_current_speaker_type: next_type,
        sequence_progress_count: next_progress,
        updated_at: new Date(),
      })
      .where(eq(podcastConfigs.podcast_id, podcastId));

    console.log(
      `[FORMAT_DETERMINER] Updated sequence state for podcast ${podcastId}: ` +
      `type=${next_type}, progress=${next_progress}`
    );
  } catch (error) {
    console.error(`[FORMAT_DETERMINER] Failed to update sequence state:`, error);
    throw new Error(`Failed to update sequence state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
