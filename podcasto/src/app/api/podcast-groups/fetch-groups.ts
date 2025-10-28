import { db } from '@/lib/db';
import { podcastGroups, podcastLanguages } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export type DatabaseClient = Pick<typeof db, 'select'>;

export type GroupRecord = {
  id: string;
  base_title: string;
  base_description: string | null;
  base_cover_image: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type LanguageRecord = {
  id: string;
  language_code: string;
  title: string;
  is_primary: boolean;
  podcast_id: string;
};

export type GroupWithLanguages = GroupRecord & {
  languages: LanguageRecord[];
  language_count: number;
};

export async function fetchPodcastGroupsWithLanguages(
  client: DatabaseClient = db
): Promise<GroupWithLanguages[]> {
  const groups = await client
    .select({
      id: podcastGroups.id,
      base_title: podcastGroups.base_title,
      base_description: podcastGroups.base_description,
      base_cover_image: podcastGroups.base_cover_image,
      created_at: podcastGroups.created_at,
      updated_at: podcastGroups.updated_at,
    })
    .from(podcastGroups)
    .orderBy(podcastGroups.created_at);

  const groupIds = groups.map((group) => group.id);
  const languagesByGroup = new Map<string, LanguageRecord[]>();

  if (groupIds.length > 0) {
    const languages = await client
      .select({
        id: podcastLanguages.id,
        language_code: podcastLanguages.language_code,
        title: podcastLanguages.title,
        is_primary: podcastLanguages.is_primary,
        podcast_id: podcastLanguages.podcast_id,
        podcast_group_id: podcastLanguages.podcast_group_id,
      })
      .from(podcastLanguages)
      .where(inArray(podcastLanguages.podcast_group_id, groupIds))
      .orderBy(podcastLanguages.language_code);

    for (const language of languages) {
      const { podcast_group_id, ...languageData } = language;
      if (!languagesByGroup.has(podcast_group_id)) {
        languagesByGroup.set(podcast_group_id, []);
      }
      languagesByGroup.get(podcast_group_id)!.push(languageData);
    }
  }

  return groups.map((group) => {
    const languages = languagesByGroup.get(group.id) ?? [];
    return {
      ...group,
      languages,
      language_count: languages.length,
    } satisfies GroupWithLanguages;
  });
}
