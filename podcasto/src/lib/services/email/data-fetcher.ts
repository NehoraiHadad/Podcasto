/**
 * Data fetching utilities for email notifications
 */

import { episodesApi, podcastsApi, subscriptionsApi } from '@/lib/db/api';
import type { Podcast } from '@/lib/db/api/podcasts';
import { db, episodes, subscriptions } from '@/lib/db';
import { sql } from 'drizzle-orm';
import type { EpisodeEmailData } from '@/lib/email/templates/new-episode';
import type { BatchUserData } from './types';
import type { InferSelectModel } from 'drizzle-orm';

type Episode = InferSelectModel<typeof episodes>;
type Subscription = InferSelectModel<typeof subscriptions>;

/**
 * Fetches episode and podcast data with validation
 * @param episodeId - ID of the episode
 * @param logPrefix - Log prefix for consistent logging
 * @returns Episode and podcast objects, or error string
 */
export async function fetchEpisodeAndPodcast(
  episodeId: string,
  logPrefix: string
): Promise<
  | { success: true; episode: Episode; podcast: Podcast }
  | { success: false; error: string }
> {
  // Get episode
  const episode = await episodesApi.getEpisodeById(episodeId);
  if (!episode) {
    const error = 'Episode not found';
    console.error(`${logPrefix} ${error}`);
    return { success: false, error };
  }

  if (!episode.podcast_id) {
    const error = 'Episode has no podcast_id';
    console.error(`${logPrefix} ${error}`);
    return { success: false, error };
  }

  // Get podcast
  const podcast = await podcastsApi.getPodcastById(episode.podcast_id);
  if (!podcast) {
    const error = 'Podcast not found';
    console.error(`${logPrefix} ${error}`);
    return { success: false, error };
  }

  console.log(`${logPrefix} Found episode "${episode.title}" from podcast "${podcast.title}"`);

  return { success: true, episode, podcast };
}

/**
 * Fetches all subscribers for a podcast
 * @param podcastId - ID of the podcast
 * @param logPrefix - Log prefix for consistent logging
 * @returns Array of subscriptions
 */
export async function fetchSubscribers(
  podcastId: string,
  logPrefix: string
): Promise<Subscription[]> {
  const subscribers = await subscriptionsApi.getPodcastSubscriptions(podcastId);
  console.log(`${logPrefix} Found ${subscribers.length} subscribers`);
  return subscribers;
}

/**
 * Batch fetches user data (email, preferences, sent status) for all subscribers
 * @param episodeId - ID of the episode
 * @param userIds - Array of user IDs
 * @param logPrefix - Log prefix for consistent logging
 * @returns Map of user ID to user data
 */
export async function fetchUserBatchData(
  episodeId: string,
  userIds: string[],
  logPrefix: string
): Promise<Map<string, BatchUserData>> {
  console.log(`${logPrefix} Fetching data for ${userIds.length} users in batch query`);

  const batchResult = await db.execute<BatchUserData>(sql`
    SELECT
      u.id as user_id,
      u.email,
      COALESCE(p.email_notifications, true) as email_notifications,
      CASE WHEN se.id IS NOT NULL THEN true ELSE false END as already_sent
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN sent_episodes se ON se.user_id = u.id AND se.episode_id = ${episodeId}
    WHERE u.id = ANY(${userIds}::uuid[])
  `);

  console.log(`${logPrefix} Batch query returned ${batchResult.length} user records`);

  // Create a map for fast lookup
  const userDataMap = new Map<string, BatchUserData>();
  for (const userData of batchResult) {
    userDataMap.set(userData.user_id, userData);
  }

  return userDataMap;
}

/**
 * Prepares email data object from episode and podcast
 * @param episode - Episode object
 * @param podcast - Podcast object
 * @returns Email data object
 */
export function prepareEmailData(
  episode: Episode,
  podcast: Podcast
): EpisodeEmailData {
  return {
    episodeId: episode.id,
    episodeTitle: episode.title,
    episodeDescription: episode.description || undefined,
    podcastTitle: podcast.title,
    podcastId: podcast.id,
    coverImage: episode.cover_image || podcast.cover_image || undefined,
    duration: episode.duration || undefined,
    publishedAt: episode.published_at ? new Date(episode.published_at) : undefined,
  };
}
