import { db } from '../index';
import { episodeProcessingLogs, episodes } from '../schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { ProcessingStage } from '@/types/processing';

/**
 * Database API for episode processing logs
 * Provides methods to query and analyze processing stage information
 */

/**
 * Get all processing logs for a specific episode
 */
export async function getProcessingLogsByEpisodeId(episodeId: string) {
  try {
    return await db
      .select()
      .from(episodeProcessingLogs)
      .where(eq(episodeProcessingLogs.episode_id, episodeId))
      .orderBy(desc(episodeProcessingLogs.created_at));
  } catch (error) {
    console.error('[DB_API] Error fetching processing logs:', error);
    throw error;
  }
}

/**
 * Get the latest log entry for a specific episode and stage
 */
export async function getLatestLogForStage(
  episodeId: string,
  stage: ProcessingStage
) {
  try {
    const logs = await db
      .select()
      .from(episodeProcessingLogs)
      .where(
        and(
          eq(episodeProcessingLogs.episode_id, episodeId),
          eq(episodeProcessingLogs.stage, stage as string)
        )
      )
      .orderBy(desc(episodeProcessingLogs.created_at))
      .limit(1);

    return logs[0] || null;
  } catch (error) {
    console.error('[DB_API] Error fetching latest log for stage:', error);
    throw error;
  }
}

/**
 * Get all failed processing stages across episodes
 */
export async function getFailedProcessingLogs(limit = 50) {
  try {
    return await db
      .select({
        log: episodeProcessingLogs,
        episode: {
          id: episodes.id,
          title: episodes.title,
          podcast_id: episodes.podcast_id,
          created_at: episodes.created_at
        }
      })
      .from(episodeProcessingLogs)
      .innerJoin(episodes, eq(episodeProcessingLogs.episode_id, episodes.id))
      .where(eq(episodeProcessingLogs.status, 'failed'))
      .orderBy(desc(episodeProcessingLogs.created_at))
      .limit(limit);
  } catch (error) {
    console.error('[DB_API] Error fetching failed logs:', error);
    throw error;
  }
}

/**
 * Get aggregated statistics for processing stages
 */
export async function getProcessingStats() {
  try {
    const stats = await db
      .select({
        stage: episodeProcessingLogs.stage,
        status: episodeProcessingLogs.status,
        count: sql<number>`cast(count(*) as integer)`,
        avg_duration: sql<number>`cast(avg(${episodeProcessingLogs.duration_ms}) as integer)`
      })
      .from(episodeProcessingLogs)
      .groupBy(episodeProcessingLogs.stage, episodeProcessingLogs.status);

    return stats;
  } catch (error) {
    console.error('[DB_API] Error fetching processing stats:', error);
    throw error;
  }
}

/**
 * Get episodes with their current processing stage
 */
export async function getEpisodesWithProcessingStage(
  podcastId?: string,
  limit = 50
) {
  try {
    const query = db
      .select({
        id: episodes.id,
        title: episodes.title,
        podcast_id: episodes.podcast_id,
        status: episodes.status,
        current_stage: episodes.current_stage,
        processing_started_at: episodes.processing_started_at,
        last_stage_update: episodes.last_stage_update,
        created_at: episodes.created_at,
        published_at: episodes.published_at
      })
      .from(episodes)
      .orderBy(desc(episodes.last_stage_update))
      .limit(limit);

    if (podcastId) {
      return await query.where(eq(episodes.podcast_id, podcastId));
    }

    return await query;
  } catch (error) {
    console.error('[DB_API] Error fetching episodes with stages:', error);
    throw error;
  }
}

/**
 * Get stuck episodes (processing for too long)
 */
export async function getStuckEpisodes(thresholdMinutes = 30) {
  try {
    const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    return await db
      .select()
      .from(episodes)
      .where(
        and(
          sql`${episodes.processing_started_at} < ${thresholdDate.toISOString()}`,
          sql`${episodes.current_stage} IN ('telegram_processing', 'script_processing', 'audio_processing')`
        )
      )
      .orderBy(desc(episodes.processing_started_at));
  } catch (error) {
    console.error('[DB_API] Error fetching stuck episodes:', error);
    throw error;
  }
}

/**
 * Get episodes by current processing stage
 */
export async function getEpisodesByStage(stage: ProcessingStage) {
  try {
    return await db
      .select()
      .from(episodes)
      .where(eq(episodes.current_stage, stage as string))
      .orderBy(desc(episodes.last_stage_update));
  } catch (error) {
    console.error('[DB_API] Error fetching episodes by stage:', error);
    throw error;
  }
}

export const episodeProcessingLogsApi = {
  getProcessingLogsByEpisodeId,
  getLatestLogForStage,
  getFailedProcessingLogs,
  getProcessingStats,
  getEpisodesWithProcessingStage,
  getStuckEpisodes,
  getEpisodesByStage
};
