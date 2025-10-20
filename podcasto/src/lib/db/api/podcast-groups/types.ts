import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { podcastGroups, podcastLanguages } from '@/lib/db/schema';
import type { Podcast, PodcastWithConfig } from '../podcasts/types';

/**
 * Podcast Group model - represents a multilingual podcast group
 */
export type PodcastGroup = InferSelectModel<typeof podcastGroups>;

/**
 * New podcast group data for insertion
 */
export type NewPodcastGroup = InferInsertModel<typeof podcastGroups>;

/**
 * Podcast Language model - represents a language variant of a podcast group
 */
export type PodcastLanguage = InferSelectModel<typeof podcastLanguages>;

/**
 * New podcast language data for insertion
 */
export type NewPodcastLanguage = InferInsertModel<typeof podcastLanguages>;

/**
 * Extended podcast language with related podcast data
 */
export type PodcastLanguageWithPodcast = PodcastLanguage & {
  podcast?: Podcast | PodcastWithConfig;
};

/**
 * Extended podcast group with all language variants
 */
export type PodcastGroupWithLanguages = PodcastGroup & {
  languages: PodcastLanguageWithPodcast[];
};

/**
 * Data for creating a new multilingual podcast group
 */
export type CreatePodcastGroupData = {
  base_title: string;
  base_description?: string;
  base_cover_image?: string;
  languages: Array<{
    language_code: string;
    title: string;
    description?: string;
    cover_image?: string;
    is_primary: boolean;
    podcast_id: string; // Existing podcast ID or will be created
  }>;
};

/**
 * Data for adding a language variant to an existing podcast group
 */
export type AddLanguageVariantData = {
  podcast_group_id: string;
  language_code: string;
  title: string;
  description?: string;
  cover_image?: string;
  is_primary?: boolean;
  podcast_id: string;
};
