import { podcastGroups, podcastLanguages, podcasts } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import { db } from '../../index';
import type {
  PodcastGroup,
  PodcastLanguage,
  PodcastGroupWithLanguages,
  PodcastLanguageWithPodcast
} from './types';

/**
 * Get podcast group by ID (basic data only)
 *
 * @param id - Podcast group ID (UUID)
 * @returns The podcast group if found, null otherwise
 */
export async function getPodcastGroupById(id: string): Promise<PodcastGroup | null> {
  return await dbUtils.findById<PodcastGroup>(podcastGroups, podcastGroups.id, id);
}

/**
 * Get podcast group with all language variants
 *
 * @param id - Podcast group ID (UUID)
 * @returns The podcast group with languages if found, null otherwise
 */
export async function getPodcastGroupWithLanguages(id: string): Promise<PodcastGroupWithLanguages | null> {
  const group = await getPodcastGroupById(id);
  if (!group) return null;

  const languages = await db
    .select()
    .from(podcastLanguages)
    .where(eq(podcastLanguages.podcast_group_id, id));

  return {
    ...group,
    languages: languages as PodcastLanguageWithPodcast[]
  };
}

/**
 * Get podcast by group ID and language code
 *
 * @param groupId - Podcast group ID
 * @param languageCode - Language code (e.g., 'he', 'en')
 * @returns The podcast language variant if found, null otherwise
 */
export async function getPodcastByGroupAndLanguage(
  groupId: string,
  languageCode: string
): Promise<PodcastLanguageWithPodcast | null> {
  const result = await db
    .select()
    .from(podcastLanguages)
    .leftJoin(podcasts, eq(podcastLanguages.podcast_id, podcasts.id))
    .where(
      and(
        eq(podcastLanguages.podcast_group_id, groupId),
        eq(podcastLanguages.language_code, languageCode)
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  return {
    ...result[0].podcast_languages,
    podcast: result[0].podcasts || undefined
  };
}

/**
 * Get all language variants for a podcast group
 *
 * @param groupId - Podcast group ID
 * @returns Array of language variants
 */
export async function getPodcastLanguagesByGroupId(
  groupId: string
): Promise<PodcastLanguage[]> {
  return await dbUtils.findBy<PodcastLanguage>(
    podcastLanguages,
    eq(podcastLanguages.podcast_group_id, groupId)
  );
}

/**
 * Get primary language for a podcast group
 *
 * @param groupId - Podcast group ID
 * @returns The primary language variant if found, null otherwise
 */
export async function getPrimaryLanguage(groupId: string): Promise<PodcastLanguage | null> {
  const result = await db
    .select()
    .from(podcastLanguages)
    .where(
      and(
        eq(podcastLanguages.podcast_group_id, groupId),
        eq(podcastLanguages.is_primary, true)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all podcast groups
 *
 * @returns Array of all podcast groups
 */
export async function getAllPodcastGroups(): Promise<PodcastGroup[]> {
  return await dbUtils.getAll<PodcastGroup>(podcastGroups);
}

/**
 * Get all podcast groups with their languages
 *
 * @returns Array of all podcast groups with languages
 */
export async function getAllPodcastGroupsWithLanguages(): Promise<PodcastGroupWithLanguages[]> {
  const groups = await getAllPodcastGroups();

  const groupsWithLanguages = await Promise.all(
    groups.map(async (group) => {
      const languages = await getPodcastLanguagesByGroupId(group.id);
      return {
        ...group,
        languages: languages as PodcastLanguageWithPodcast[]
      };
    })
  );

  return groupsWithLanguages;
}

/**
 * Check if a language exists in a podcast group
 *
 * @param groupId - Podcast group ID
 * @param languageCode - Language code to check
 * @returns true if language exists, false otherwise
 */
export async function languageExistsInGroup(
  groupId: string,
  languageCode: string
): Promise<boolean> {
  const condition = and(
    eq(podcastLanguages.podcast_group_id, groupId),
    eq(podcastLanguages.language_code, languageCode)
  );

  if (!condition) return false;

  return await dbUtils.exists(podcastLanguages, condition);
}

/**
 * Get podcast group by podcast ID
 *
 * @param podcastId - Podcast ID
 * @returns The podcast group if found, null otherwise
 */
export async function getPodcastGroupByPodcastId(podcastId: string): Promise<PodcastGroup | null> {
  const result = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .limit(1);

  if (result.length === 0 || !result[0].podcast_group_id) return null;

  return await getPodcastGroupById(result[0].podcast_group_id);
}

/**
 * Get all active podcast groups for public display
 * Only returns groups that have at least one language variant
 *
 * @returns Array of podcast groups with their language variants
 */
export async function getActivePodcastGroups(): Promise<PodcastGroupWithLanguages[]> {
  const groups = await getAllPodcastGroups();

  const groupsWithLanguages = await Promise.all(
    groups.map(async (group) => {
      const languages = await getPodcastLanguagesByGroupId(group.id);
      return {
        ...group,
        languages: languages as PodcastLanguageWithPodcast[]
      };
    })
  );

  // Filter out groups without any languages
  return groupsWithLanguages.filter(group => group.languages.length > 0);
}

/**
 * Get legacy podcasts (podcasts not part of any group)
 * Returns podcasts where podcast_group_id IS NULL
 *
 * @returns Array of legacy podcasts
 */
export async function getLegacyPodcasts() {
  const result = await db
    .select()
    .from(podcasts)
    .where(isNull(podcasts.podcast_group_id));

  return result;
}
