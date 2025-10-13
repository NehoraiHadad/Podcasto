'use server';

import { cache } from 'react';
import { podcastsApi, episodesApi, userRolesApi } from '@/lib/db/api';
import type { AdminDashboardStats } from './types';

/**
 * Fetches statistics for the admin dashboard
 * This is cached to avoid multiple database calls
 *
 * Retrieves counts for:
 * - Total podcasts in the system
 * - Total episodes across all podcasts
 * - Total users with assigned roles
 *
 * @returns Object containing dashboard statistics
 *
 * @example
 * const stats = await getAdminDashboardStats();
 * console.log(`${stats.totalPodcasts} podcasts, ${stats.totalEpisodes} episodes`);
 */
export const getAdminDashboardStats = cache(async (): Promise<AdminDashboardStats> => {
  try {
    // Get counts using Drizzle APIs
    const totalPodcasts = await podcastsApi.getPodcastCount();
    const totalEpisodes = await episodesApi.getEpisodeCount();
    const totalUsers = await userRolesApi.getUserRoleCount();

    return {
      totalPodcasts,
      totalEpisodes,
      totalUsers
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return {
      totalPodcasts: 0,
      totalEpisodes: 0,
      totalUsers: 0
    };
  }
});
