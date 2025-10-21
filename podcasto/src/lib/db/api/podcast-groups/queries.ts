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
 * OPTIMIZED: Uses single JOIN query instead of N+1 queries
 *
 * @returns Array of podcast groups with their language variants
 */
export async function getActivePodcastGroups(): Promise<PodcastGroupWithLanguages[]> {
  // Single optimized query with JOIN
  const result = await db
    .select()
    .from(podcastGroups)
    .leftJoin(podcastLanguages, eq(podcastLanguages.podcast_group_id, podcastGroups.id));

  // Group results by podcast_group_id
  const groupedByPodcastGroup = new Map<string, PodcastGroupWithLanguages>();

  for (const row of result) {
    const group = row.podcast_groups;
    const language = row.podcast_languages;

    // Skip if no group (shouldn't happen with our query)
    if (!group) continue;

    // Initialize group if not seen before
    if (!groupedByPodcastGroup.has(group.id)) {
      groupedByPodcastGroup.set(group.id, {
        ...group,
        languages: []
      });
    }

    // Add language variant if it exists
    if (language) {
      groupedByPodcastGroup.get(group.id)!.languages.push(language as PodcastLanguageWithPodcast);
    }
  }

  // Convert map to array and filter out groups without languages
  return Array.from(groupedByPodcastGroup.values())
    .filter(group => group.languages.length > 0);
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

/**
 * Unified display item - represents either a podcast group or a legacy podcast
 */
export interface UnifiedPodcastDisplay {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  type: 'group' | 'legacy';
  // For groups: the podcast group data
  group_data?: PodcastGroupWithLanguages;
  // For legacy: the podcast data
  podcast_data?: {
    id: string;
    title: string;
    description: string | null;
    cover_image: string | null;
    image_style: string | null;
    is_paused: boolean;
    created_by: string | null;
    podcast_group_id: string | null;
    language_code: string | null;
    migration_status: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  };
}

/**
 * Get all podcasts for public display in a unified format
 * Returns both podcast groups (with primary language) and legacy podcasts
 * in a single, optimized query structure.
 *
 * This is the RECOMMENDED query for public-facing podcast lists.
 *
 * @returns Array of unified podcast display items
 */
export async function getAllPodcastsForDisplay(): Promise<UnifiedPodcastDisplay[]> {
  // Fetch both types in parallel
  const [groups, legacyPodcasts] = await Promise.all([
    getActivePodcastGroups(),
    getLegacyPodcasts()
  ]);

  const items: UnifiedPodcastDisplay[] = [];

  // Convert podcast groups
  for (const group of groups) {
    const primaryLang = group.languages.find(l => l.is_primary) || group.languages[0];
    items.push({
      id: group.id,
      title: primaryLang.title,
      description: primaryLang.description,
      cover_image: primaryLang.cover_image || group.base_cover_image,
      created_at: group.created_at,
      updated_at: group.updated_at,
      type: 'group',
      group_data: group
    });
  }

  // Add legacy podcasts
  for (const podcast of legacyPodcasts) {
    items.push({
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      cover_image: podcast.cover_image,
      created_at: podcast.created_at,
      updated_at: podcast.updated_at,
      type: 'legacy',
      podcast_data: {
        id: podcast.id,
        title: podcast.title,
        description: podcast.description,
        cover_image: podcast.cover_image,
        image_style: podcast.image_style,
        is_paused: podcast.is_paused,
        created_by: podcast.created_by,
        podcast_group_id: podcast.podcast_group_id,
        language_code: podcast.language_code,
        migration_status: podcast.migration_status,
        created_at: podcast.created_at,
        updated_at: podcast.updated_at
      }
    });
  }

  // Sort by updated_at descending (newest first)
  items.sort((a, b) => {
    const dateA = a.updated_at?.getTime() || 0;
    const dateB = b.updated_at?.getTime() || 0;
    return dateB - dateA;
  });

  return items;
}
