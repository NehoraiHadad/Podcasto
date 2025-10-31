import 'server-only';

import { db } from '../../index';
import { podcasts, episodes } from '../../schema';
import { eq, isNull, asc, sql } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import type { Podcast, PodcastWithEpisodeStats } from './types';
import {
  transformPodcastImageUrls,
  transformPodcastImageUrlsBatch,
} from '@/lib/db/api/utils/image-url-transformer';

/**
 * Get podcast by ID (basic data only)
 *
 * @param id - Podcast ID (UUID)
 * @returns The podcast if found, null otherwise
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastById('123-456');
 * if (podcast) {
 *   console.log(podcast.title);
 * }
 * ```
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  const podcast = await dbUtils.findById<Podcast>(podcasts, podcasts.id, id);
  if (!podcast) return null;
  return transformPodcastImageUrls(podcast);
}

/**
 * Get all podcasts (basic data only, without relations)
 *
 * @returns Array of all podcasts
 *
 * @example
 * ```typescript
 * const allPodcasts = await getAllPodcastsBasic();
 * console.log(`Total podcasts: ${allPodcasts.length}`);
 * ```
 */
export async function getAllPodcastsBasic(): Promise<Podcast[]> {
  const allPodcasts = await dbUtils.getAll<Podcast>(podcasts);
  return transformPodcastImageUrlsBatch(allPodcasts);
}

/**
 * Get podcasts that are not associated with any podcast group
 *
 * @returns Array of podcasts eligible for migration
 *
 * @example
 * ```typescript
 * const eligiblePodcasts = await getPodcastsEligibleForMigration();
 * console.log(`Eligible podcasts: ${eligiblePodcasts.length}`);
 * ```
 */
export async function getPodcastsEligibleForMigration(): Promise<Podcast[]> {
  const eligiblePodcasts = await dbUtils.findBy<Podcast>(podcasts, isNull(podcasts.podcast_group_id));
  return transformPodcastImageUrlsBatch(eligiblePodcasts);
}

/**
 * Get paginated podcasts (basic data only, without relations)
 *
 * @param page - Page number (1-based)
 * @param pageSize - Number of records per page
 * @returns Array of paginated podcasts
 *
 * @example
 * ```typescript
 * const page1 = await getPodcastsPaginatedBasic(1, 10);
 * const page2 = await getPodcastsPaginatedBasic(2, 10);
 * ```
 */
export async function getPodcastsPaginatedBasic(
  page: number = 1,
  pageSize: number = 10
): Promise<Podcast[]> {
  const paginatedPodcasts = await dbUtils.getPaginated<Podcast>(podcasts, page, pageSize);
  return transformPodcastImageUrlsBatch(paginatedPodcasts);
}

/**
 * Get total count of podcasts
 *
 * @returns The total number of podcasts
 *
 * @example
 * ```typescript
 * const total = await getPodcastCount();
 * console.log(`Total podcasts: ${total}`);
 * ```
 */
export async function getPodcastCount(): Promise<number> {
  return await dbUtils.count(podcasts);
}

/**
 * Check if a podcast exists by title
 *
 * @param title - Podcast title to check
 * @returns true if podcast exists, false otherwise
 *
 * @example
 * ```typescript
 * const exists = await podcastExistsByTitle('Tech Talk');
 * if (exists) {
 *   console.log('Podcast already exists');
 * }
 * ```
 */
export async function podcastExistsByTitle(title: string): Promise<boolean> {
  return await dbUtils.exists(podcasts, eq(podcasts.title, title));
}

/**
 * Get podcasts created by a specific user along with episode counts
 *
 * @param userId - ID of the user who owns the podcasts
 * @returns Array of podcasts with episode statistics
 *
 * @example
 * ```typescript
 * const podcasts = await getUserPodcastsWithEpisodeStats('user-123');
 * console.log(podcasts[0].episodeCount); // => 5
 * ```
 */
export async function getUserPodcastsWithEpisodeStats(
  userId: string
): Promise<PodcastWithEpisodeStats[]> {
  const rows = await db
    .select({
      id: podcasts.id,
      title: podcasts.title,
      description: podcasts.description,
      cover_image: podcasts.cover_image,
      image_style: podcasts.image_style,
      is_paused: podcasts.is_paused,
      created_by: podcasts.created_by,
      podcast_group_id: podcasts.podcast_group_id,
      language_code: podcasts.language_code,
      migration_status: podcasts.migration_status,
      auto_generation_enabled: podcasts.auto_generation_enabled,
      last_auto_generated_at: podcasts.last_auto_generated_at,
      next_scheduled_generation: podcasts.next_scheduled_generation,
      created_at: podcasts.created_at,
      updated_at: podcasts.updated_at,
      episodeCount: sql<number>`COALESCE(count(${episodes.id}), 0)::int`
    })
    .from(podcasts)
    .leftJoin(episodes, eq(episodes.podcast_id, podcasts.id))
    .where(eq(podcasts.created_by, userId))
    .groupBy(podcasts.id)
    .orderBy(asc(podcasts.created_at));

  return rows.map(({ episodeCount, ...podcast }) => ({
    podcast: transformPodcastImageUrls(podcast as Podcast),
    episodeCount,
  }));
}

/**
 * Get podcast by ID with podcastConfigs relation
 * This is the standard query to use for edit forms and pages that need full podcast configuration
 *
 * @param id - Podcast ID (UUID)
 * @returns The podcast with podcastConfigs relation, or null if not found
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastByIdWithConfig('123-456');
 * if (podcast) {
 *   const config = podcast.podcastConfigs?.[0];
 *   console.log(config?.podcast_format); // 'single-speaker' | 'multi-speaker'
 * }
 * ```
 */
export async function getPodcastByIdWithConfig(id: string) {
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, id),
    with: {
      podcastConfigs: true,
    },
  });

  if (!podcast) return null;
  return transformPodcastImageUrls(podcast);
}
