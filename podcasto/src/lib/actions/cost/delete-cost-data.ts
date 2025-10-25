'use server';

import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  costTrackingEvents,
  episodeCosts,
  dailyCostSummary,
  monthlyCostSummary,
} from '@/lib/db/schema';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/error-utils';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DELETE_COST_DATA');

/**
 * Delete all cost tracking data from the system.
 * Use this to clear inaccurate historical data before starting fresh tracking.
 *
 * WARNING: This action is irreversible!
 */
export async function deleteAllCostData(): Promise<{
  success: boolean;
  error?: string;
  deletedCounts?: {
    events: number;
    episodeCosts: number;
    dailySummaries: number;
    monthlySummaries: number;
  };
}> {
  try {
    await requireAdmin();

    logger.info('Starting deletion of all cost tracking data');

    // Delete in reverse dependency order
    const [dailyDeleted, monthlyDeleted, episodeCostsDeleted, eventsDeleted] =
      await Promise.all([
        db.delete(dailyCostSummary),
        db.delete(monthlyCostSummary),
        db.delete(episodeCosts),
        db.delete(costTrackingEvents),
      ]);

    const deletedCounts = {
      events: eventsDeleted.length,
      episodeCosts: episodeCostsDeleted.length,
      dailySummaries: dailyDeleted.length,
      monthlySummaries: monthlyDeleted.length,
    };

    logger.info('Deleted cost data', deletedCounts);

    return createSuccessResponse({ deletedCounts });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to delete cost data',
      'DELETE_COST_DATA'
    );
  }
}

/**
 * Delete cost data for a specific date range.
 * Useful for removing data from a specific period that had tracking issues.
 */
export async function deleteCostDataByDateRange(
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean;
  error?: string;
  deletedCounts?: {
    events: number;
    episodeCosts: number;
  };
}> {
  try {
    await requireAdmin();

    logger.info('Deleting cost data by date range', { startDate, endDate });

    // Delete events in date range
    const deletedEvents = await db
      .delete(costTrackingEvents)
      .where(
        and(
          sql`${costTrackingEvents.timestamp} >= ${startDate}`,
          sql`${costTrackingEvents.timestamp} <= ${endDate}`
        )
      );

    // Note: We don't delete episodeCosts here because they're aggregates.
    // After deleting events, user should recalculate episode costs.

    const deletedCounts = {
      events: deletedEvents.length,
      episodeCosts: 0, // Not deleted, needs recalculation
    };

    return createSuccessResponse({ deletedCounts });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to delete cost data by date range',
      'DELETE_COST_DATA'
    );
  }
}

/**
 * Delete cost data for a specific episode.
 * Useful when an episode was deleted or needs cost recalculation.
 */
export async function deleteEpisodeCostData(episodeId: string): Promise<{
  success: boolean;
  error?: string;
  deletedCounts?: {
    events: number;
    episodeCosts: number;
  };
}> {
  try {
    await requireAdmin();

    logger.info('Deleting cost data for episode', { episodeId });

    const [deletedEvents, deletedEpisodeCosts] = await Promise.all([
      db
        .delete(costTrackingEvents)
        .where(eq(costTrackingEvents.episode_id, episodeId)),
      db.delete(episodeCosts).where(eq(episodeCosts.episode_id, episodeId)),
    ]);

    const deletedCounts = {
      events: deletedEvents.length,
      episodeCosts: deletedEpisodeCosts.length,
    };

    return createSuccessResponse({ deletedCounts });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to delete episode cost data',
      'DELETE_COST_DATA'
    );
  }
}

/**
 * Delete cost data for a specific podcast.
 * This deletes:
 * - Podcast-level costs (where episode_id is NULL)
 * - All episode costs for this podcast
 */
export async function deletePodcastCostData(podcastId: string): Promise<{
  success: boolean;
  error?: string;
  deletedCounts?: {
    podcastLevelEvents: number;
    episodeLevelEvents: number;
    episodeCosts: number;
  };
}> {
  try {
    await requireAdmin();

    logger.info('Deleting cost data for podcast', { podcastId });

    // Delete podcast-level events (no episode_id)
    const deletedPodcastEvents = await db
      .delete(costTrackingEvents)
      .where(
        and(
          eq(costTrackingEvents.podcast_id, podcastId),
          isNull(costTrackingEvents.episode_id)
        )
      );

    // Delete episode-level events for this podcast
    const deletedEpisodeEvents = await db
      .delete(costTrackingEvents)
      .where(
        and(
          eq(costTrackingEvents.podcast_id, podcastId),
          isNotNull(costTrackingEvents.episode_id)
        )
      );

    // Delete aggregated episode costs
    const deletedEpisodeCosts = await db
      .delete(episodeCosts)
      .where(eq(episodeCosts.podcast_id, podcastId));

    const deletedCounts = {
      podcastLevelEvents: deletedPodcastEvents.length,
      episodeLevelEvents: deletedEpisodeEvents.length,
      episodeCosts: deletedEpisodeCosts.length,
    };

    return createSuccessResponse({ deletedCounts });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to delete podcast cost data',
      'DELETE_COST_DATA'
    );
  }
}

/**
 * Get statistics about cost data before deletion.
 * Useful for showing a confirmation dialog.
 */
export async function getCostDataStats(): Promise<{
  success: boolean;
  error?: string;
  stats?: {
    totalEvents: number;
    totalEpisodeCosts: number;
    totalDailySummaries: number;
    totalMonthlySummaries: number;
    oldestEvent: Date | null;
    newestEvent: Date | null;
    podcastLevelEvents: number;
    episodeLevelEvents: number;
  };
}> {
  try {
    await requireAdmin();

    const [
      { count: eventsCount },
      { count: episodeCostsCount },
      { count: dailyCount },
      { count: monthlyCount },
      { oldest },
      { newest },
      { count: podcastLevelCount },
      { count: episodeLevelCount },
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(costTrackingEvents)
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(episodeCosts)
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(dailyCostSummary)
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(monthlyCostSummary)
        .then((r) => r[0]),
      db
        .select({
          oldest: sql<Date | null>`min(${costTrackingEvents.timestamp})`,
        })
        .from(costTrackingEvents)
        .then((r) => r[0]),
      db
        .select({
          newest: sql<Date | null>`max(${costTrackingEvents.timestamp})`,
        })
        .from(costTrackingEvents)
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(costTrackingEvents)
        .where(isNull(costTrackingEvents.episode_id))
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(costTrackingEvents)
        .where(isNotNull(costTrackingEvents.episode_id))
        .then((r) => r[0]),
    ]);

    const stats = {
      totalEvents: Number(eventsCount),
      totalEpisodeCosts: Number(episodeCostsCount),
      totalDailySummaries: Number(dailyCount),
      totalMonthlySummaries: Number(monthlyCount),
      oldestEvent: oldest || null,
      newestEvent: newest || null,
      podcastLevelEvents: Number(podcastLevelCount),
      episodeLevelEvents: Number(episodeLevelCount),
    };

    return createSuccessResponse({ stats });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to get cost data stats',
      'DELETE_COST_DATA'
    );
  }
}
