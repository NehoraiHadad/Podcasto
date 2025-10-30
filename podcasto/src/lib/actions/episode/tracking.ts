'use server';

import { episodeProcessingLogsApi } from '@/lib/db/api/episode-processing-logs';
import { requireAdmin } from '@/lib/auth/server';
import { errorToString, logError } from '@/lib/utils/error-utils';
import type { ProcessingLogEntry, ProcessingStage, StageStatus } from '@/types/processing';

type ActionResponse<T = unknown> = { success: boolean; data?: T; error?: string };
type FailedEpisode = { log: ProcessingLogEntry; episode: { id: string; title: string; podcast_id: string | null; created_at: string | null } };

/**
 * Get all processing logs for an episode
 * Returns timeline of all stages with timing and errors
 */
export async function getEpisodeProcessingLogs(episodeId: string): Promise<ActionResponse<ProcessingLogEntry[]>> {
  try {
    const logs = await episodeProcessingLogsApi.getProcessingLogsByEpisodeId(episodeId);
    const serializedLogs: ProcessingLogEntry[] = logs.map(log => ({
      id: log.id,
      episode_id: log.episode_id,
      stage: log.stage as ProcessingStage,
      status: log.status as StageStatus,
      error_message: log.error_message || undefined,
      error_details: log.error_details || undefined,
      metadata: log.metadata || undefined,
      started_at: log.started_at?.toISOString(),
      completed_at: log.completed_at?.toISOString(),
      duration_ms: log.duration_ms || undefined,
      created_at: log.created_at.toISOString()
    }));
    return { success: true, data: serializedLogs };
  } catch (error) {
    logError('getEpisodeProcessingLogs', error);
    return { success: false, error: errorToString(error) };
  }
}

/**
 * Get episodes that failed processing with error details
 * Requires admin permissions
 */
export async function getFailedEpisodes(limit = 50): Promise<ActionResponse<FailedEpisode[]>> {
  await requireAdmin();
  try {
    const failedLogs = await episodeProcessingLogsApi.getFailedProcessingLogs(limit);
    const serializedLogs: FailedEpisode[] = failedLogs.map(item => ({
      log: {
        id: item.log.id,
        episode_id: item.log.episode_id,
        stage: item.log.stage as ProcessingStage,
        status: item.log.status as StageStatus,
        error_message: item.log.error_message || undefined,
        error_details: item.log.error_details || undefined,
        metadata: item.log.metadata || undefined,
        started_at: item.log.started_at?.toISOString(),
        completed_at: item.log.completed_at?.toISOString(),
        duration_ms: item.log.duration_ms || undefined,
        created_at: item.log.created_at.toISOString()
      },
      episode: {
        id: item.episode.id,
        title: item.episode.title,
        podcast_id: item.episode.podcast_id,
        created_at: item.episode.created_at?.toISOString() || null
      }
    }));
    return { success: true, data: serializedLogs };
  } catch (error) {
    logError('getFailedEpisodes', error);
    return { success: false, error: errorToString(error) };
  }
}

type ProcessingStats = {
  byStage: Record<string, { total: number; avgDuration: number }>;
  byStatus: Record<string, number>;
  totalLogs: number;
};

/**
 * Get aggregated statistics about processing stages
 * Requires admin permissions
 */
export async function getProcessingStatistics(): Promise<ActionResponse<ProcessingStats>> {
  await requireAdmin();
  try {
    const stats = await episodeProcessingLogsApi.getProcessingStats();
    const byStage: Record<string, { total: number; avgDuration: number }> = {};
    const byStatus: Record<string, number> = {};
    let totalLogs = 0;

    for (const stat of stats) {
      const stage = stat.stage as string;
      const status = stat.status as string;
      const count = stat.count || 0;
      const avgDuration = stat.avg_duration || 0;

      if (!byStage[stage]) byStage[stage] = { total: 0, avgDuration: 0 };
      byStage[stage].total += count;
      byStage[stage].avgDuration = avgDuration;
      byStatus[status] = (byStatus[status] || 0) + count;
      totalLogs += count;
    }

    return { success: true, data: { byStage, byStatus, totalLogs } };
  } catch (error) {
    logError('getProcessingStatistics', error);
    return { success: false, error: errorToString(error) };
  }
}

type EpisodeInfo = {
  id: string;
  title: string;
  podcast_id: string | null;
  status: string | null;
  current_stage: string | null;
  processing_started_at?: string | null;
  last_stage_update: string | null;
};

/**
 * Get episodes stuck in processing (> threshold minutes)
 * Requires admin permissions
 */
export async function getStuckEpisodes(thresholdMinutes = 30): Promise<ActionResponse<EpisodeInfo[]>> {
  await requireAdmin();
  try {
    const stuckEpisodes = await episodeProcessingLogsApi.getStuckEpisodes(thresholdMinutes);
    return {
      success: true,
      data: stuckEpisodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        podcast_id: ep.podcast_id,
        status: ep.status,
        current_stage: ep.current_stage || null,
        processing_started_at: ep.processing_started_at?.toISOString() || null,
        last_stage_update: ep.last_stage_update?.toISOString() || null
      }))
    };
  } catch (error) {
    logError('getStuckEpisodes', error);
    return { success: false, error: errorToString(error) };
  }
}

/**
 * Get all episodes currently in a specific stage
 * Requires admin permissions
 */
export async function getEpisodesByStage(stage: ProcessingStage): Promise<ActionResponse<EpisodeInfo[]>> {
  await requireAdmin();
  try {
    const episodes = await episodeProcessingLogsApi.getEpisodesByStage(stage);
    return {
      success: true,
      data: episodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        podcast_id: ep.podcast_id,
        status: ep.status,
        current_stage: ep.current_stage || null,
        last_stage_update: ep.last_stage_update?.toISOString() || null
      }))
    };
  } catch (error) {
    logError('getEpisodesByStage', error);
    return { success: false, error: errorToString(error) };
  }
}
