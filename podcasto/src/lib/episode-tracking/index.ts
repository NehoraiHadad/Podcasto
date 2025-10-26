'use server';

import { nowUTC } from '@/lib/utils/date/server';
import { db } from '../db';
import { episodeProcessingLogs, episodes } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ProcessingStage, StageStatus } from '@/types/processing';

/**
 * Episode tracker for server-side processing stages
 * Mirrors the Python episode_tracker.py functionality
 */

interface LogMetadata {
  [key: string]: unknown;
}

interface ErrorDetails {
  error_type?: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  retry_count?: number;
}

/**
 * Log the start of a processing stage
 */
export async function logStageStart(
  episodeId: string,
  stage: ProcessingStage,
  metadata?: LogMetadata
): Promise<boolean> {
  try {
    const now = nowUTC();

    // Insert processing log
    await db.insert(episodeProcessingLogs).values({
      episode_id: episodeId,
      stage: stage as string,
      status: StageStatus.STARTED,
      started_at: now,
      metadata: metadata || {},
      created_at: now
    });

    // Update episode current_stage and last_stage_update
    // Check if processing_started_at is already set
    const episode = await db.query.episodes.findFirst({
      where: eq(episodes.id, episodeId),
      columns: { processing_started_at: true }
    });

    const updateData: {
      current_stage: string;
      last_stage_update: Date;
      processing_started_at?: Date;
    } = {
      current_stage: stage as string,
      last_stage_update: now
    };

    // Set processing_started_at only if not already set
    if (!episode?.processing_started_at) {
      updateData.processing_started_at = now;
    }

    await db.update(episodes)
      .set(updateData)
      .where(eq(episodes.id, episodeId));

    console.log(`[TRACKER] Started stage ${stage} for episode ${episodeId}`);
    return true;
  } catch (error) {
    console.error('[TRACKER] Error logging stage start:', error);
    return false;
  }
}

/**
 * Log the completion of a processing stage
 */
export async function logStageComplete(
  episodeId: string,
  stage: ProcessingStage,
  metadata?: LogMetadata
): Promise<boolean> {
  try {
    const now = nowUTC();

    // Find the most recent started log for this episode and stage
    const existingLogs = await db
      .select()
      .from(episodeProcessingLogs)
      .where(
        and(
          eq(episodeProcessingLogs.episode_id, episodeId),
          eq(episodeProcessingLogs.stage, stage as string),
          eq(episodeProcessingLogs.status, StageStatus.STARTED)
        )
      )
      .orderBy(desc(episodeProcessingLogs.created_at))
      .limit(1);

    if (existingLogs.length > 0) {
      const log = existingLogs[0];
      const startedAt = log.started_at || log.created_at;
      const durationMs = Math.floor(now.getTime() - new Date(startedAt).getTime());

      // Update the existing log
      await db.update(episodeProcessingLogs)
        .set({
          status: StageStatus.COMPLETED,
          completed_at: now,
          duration_ms: durationMs,
          ...(metadata && { metadata })
        })
        .where(eq(episodeProcessingLogs.id, log.id));

      console.log(`[TRACKER] Completed stage ${stage} for episode ${episodeId} in ${durationMs}ms`);
    } else {
      // No started log found, create a completed log
      await db.insert(episodeProcessingLogs).values({
        episode_id: episodeId,
        stage: stage as string,
        status: StageStatus.COMPLETED,
        completed_at: now,
        metadata: metadata || {},
        created_at: now
      });

      console.log(`[TRACKER] Created completed log for stage ${stage} for episode ${episodeId}`);
    }

    // Update episode
    await db.update(episodes)
      .set({
        current_stage: stage as string,
        last_stage_update: now
      })
      .where(eq(episodes.id, episodeId));

    return true;
  } catch (error) {
    console.error('[TRACKER] Error logging stage completion:', error);
    return false;
  }
}

/**
 * Log the failure of a processing stage
 */
export async function logStageFailure(
  episodeId: string,
  stage: ProcessingStage,
  error: Error,
  errorDetails?: ErrorDetails
): Promise<boolean> {
  try {
    const now = nowUTC();
    const errorMessage = error.message;

    // Build error details
    const details: ErrorDetails = errorDetails || {};
    if (!details.error_type) {
      details.error_type = error.name;
    }
    if (!details.stack_trace && error.stack) {
      details.stack_trace = error.stack;
    }

    // Find the most recent started log for this stage
    const existingLogs = await db
      .select()
      .from(episodeProcessingLogs)
      .where(
        and(
          eq(episodeProcessingLogs.episode_id, episodeId),
          eq(episodeProcessingLogs.stage, stage as string),
          eq(episodeProcessingLogs.status, StageStatus.STARTED)
        )
      )
      .orderBy(desc(episodeProcessingLogs.created_at))
      .limit(1);

    if (existingLogs.length > 0) {
      const log = existingLogs[0];
      const startedAt = log.started_at || log.created_at;
      const durationMs = Math.floor(now.getTime() - new Date(startedAt).getTime());

      // Update the existing log
      await db.update(episodeProcessingLogs)
        .set({
          status: StageStatus.FAILED,
          error_message: errorMessage,
          error_details: details,
          completed_at: now,
          duration_ms: durationMs
        })
        .where(eq(episodeProcessingLogs.id, log.id));
    } else {
      // No started log found, create a failed log
      await db.insert(episodeProcessingLogs).values({
        episode_id: episodeId,
        stage: stage as string,
        status: StageStatus.FAILED,
        error_message: errorMessage,
        error_details: details,
        completed_at: now,
        created_at: now
      });
    }

    // Determine failed stage variant
    const failedStage = getFailedStageVariant(stage);

    // Update episode status to failed
    await db.update(episodes)
      .set({
        status: 'failed',
        current_stage: failedStage,
        last_stage_update: now
      })
      .where(eq(episodes.id, episodeId));

    console.error(`[TRACKER] Failed stage ${stage} for episode ${episodeId}: ${errorMessage}`);
    return true;
  } catch (err) {
    console.error('[TRACKER] Error logging stage failure:', err);
    return false;
  }
}

/**
 * Map a processing stage to its failure variant
 */
function getFailedStageVariant(stage: ProcessingStage): string {
  const stageMapping: Record<string, string> = {
    [ProcessingStage.TELEGRAM_PROCESSING]: 'telegram_failed',
    [ProcessingStage.SCRIPT_PROCESSING]: 'script_failed',
    [ProcessingStage.AUDIO_PROCESSING]: 'audio_failed',
    [ProcessingStage.IMAGE_PROCESSING]: 'image_failed',
  };
  return stageMapping[stage] || 'failed';
}
