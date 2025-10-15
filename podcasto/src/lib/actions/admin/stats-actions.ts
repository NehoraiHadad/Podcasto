'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { podcasts, episodes } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { podcastsApi, episodesApi, userRolesApi } from '@/lib/db/api';
import type { AdminDashboardStats, AdminActivity } from './types';

/**
 * Fetches statistics for the admin dashboard
 * This is cached to avoid multiple database calls
 *
 * Retrieves counts for:
 * - Total podcasts in the system
 * - Total episodes across all podcasts
 * - Total users with assigned roles
 * - Active podcasts (not paused)
 * - Episode status breakdown
 * - Recent activity
 *
 * @returns Object containing dashboard statistics
 *
 * @example
 * const stats = await getAdminDashboardStats();
 * console.log(`${stats.totalPodcasts} podcasts, ${stats.totalEpisodes} episodes`);
 */
export const getAdminDashboardStats = cache(async (): Promise<AdminDashboardStats> => {
  try {
    // Get basic counts using Drizzle APIs
    const totalPodcasts = await podcastsApi.getPodcastCount();
    const totalEpisodes = await episodesApi.getEpisodeCount();
    const totalUsers = await userRolesApi.getUserRoleCount();

    // Get active podcasts count (not paused)
    const activePodcastsResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(podcasts)
      .where(eq(podcasts.is_paused, false));
    const activePodcasts = activePodcastsResult[0]?.count || 0;

    // Get episode status breakdown
    const statusBreakdownResult = await db
      .select({
        status: episodes.status,
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(episodes)
      .groupBy(episodes.status);

    const statusBreakdown = {
      pending: statusBreakdownResult.find(s => s.status === 'pending')?.count || 0,
      processing: statusBreakdownResult.find(s => s.status === 'processing')?.count || 0,
      published: statusBreakdownResult.find(s => s.status === 'published')?.count || 0,
      failed: statusBreakdownResult.find(s => s.status === 'failed')?.count || 0
    };

    // Get recent activity (last 10 episodes with podcast info)
    const recentEpisodesResult = await db
      .select({
        id: episodes.id,
        title: episodes.title,
        status: episodes.status,
        createdAt: episodes.created_at,
        podcastId: episodes.podcast_id,
        podcastTitle: podcasts.title
      })
      .from(episodes)
      .leftJoin(podcasts, eq(episodes.podcast_id, podcasts.id))
      .orderBy(desc(episodes.created_at))
      .limit(10);

    const recentActivity: AdminActivity[] = recentEpisodesResult.map(episode => {
      const type = episode.status === 'published' ? 'episode_published' :
                   episode.status === 'failed' ? 'episode_failed' :
                   'episode_generated';

      return {
        id: episode.id,
        type,
        title: episode.title,
        description: `Podcast: ${episode.podcastTitle || 'Unknown'}`,
        timestamp: episode.createdAt ? new Date(episode.createdAt).toLocaleString() : 'Unknown',
        metadata: {
          podcastTitle: episode.podcastTitle || undefined,
          episodeTitle: episode.title
        }
      };
    });

    return {
      totalPodcasts,
      totalEpisodes,
      totalUsers,
      activePodcasts,
      statusBreakdown,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return {
      totalPodcasts: 0,
      totalEpisodes: 0,
      totalUsers: 0,
      activePodcasts: 0,
      statusBreakdown: {
        pending: 0,
        processing: 0,
        published: 0,
        failed: 0
      },
      recentActivity: []
    };
  }
});
