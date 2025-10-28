import 'server-only';

import * as dbUtils from '../../utils';
import { podcasts } from '../../schema';
import { getPublishedPodcastEpisodes } from './episodes';
import { languageCodeToFull } from '@/lib/utils/language-mapper';
import type { Podcast, PodcastWithConfig } from './types';

/**
 * Enrich podcast with configuration data from podcast_configs table
 * This function merges podcast data with its configuration
 *
 * @param podcast - Base podcast record
 * @returns Enriched podcast with configuration fields
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastById('123-456');
 * const enriched = await enrichPodcastWithConfig(podcast);
 * console.log(enriched.output_language); // 'english' or 'hebrew'
 * ```
 */
export async function enrichPodcastWithConfig(
  podcast: Podcast
): Promise<PodcastWithConfig> {
  const publishedEpisodes = await getPublishedPodcastEpisodes(podcast.id);

  // Get podcast config if available
  const podcastConfig = await import('../podcast-configs').then((module) =>
    module.getPodcastConfigByPodcastId(podcast.id)
  );

  // Base podcast object - use published episodes count for user-facing display
  const podcastWithCount: PodcastWithConfig = {
    ...podcast,
    episodes_count: publishedEpisodes.length,
  };

  // Add configuration data if available
  if (podcastConfig) {
    // Map config fields to podcast object
    podcastWithCount.content_source = {
      type: podcastConfig.content_source as 'telegram' | 'urls',
      config: {
        telegramChannel: podcastConfig.telegram_channel || '',
        telegramHours: podcastConfig.telegram_hours || 24,
        urls: podcastConfig.urls || [],
      },
    };

    // Basic settings
    podcastWithCount.creator = podcastConfig.creator;
    podcastWithCount.podcast_name = podcastConfig.podcast_name;
    // Convert language code from podcasts table to full name
    podcastWithCount.output_language = languageCodeToFull(podcast.language_code || 'en') as
      | 'english'
      | 'hebrew';
    podcastWithCount.slogan = podcastConfig.slogan || '';
    podcastWithCount.creativity_level = podcastConfig.creativity_level
      ? podcastConfig.creativity_level / 100
      : 0.7;
    podcastWithCount.episode_frequency =
      podcastConfig.episode_frequency ?? undefined;

    // Style and roles
    podcastWithCount.conversation_style =
      podcastConfig.conversation_style ?? undefined;
    podcastWithCount.speaker1_role = podcastConfig.speaker1_role ?? undefined;
    podcastWithCount.speaker2_role = podcastConfig.speaker2_role ?? undefined;

    // Mixing techniques
    podcastWithCount.mixing_techniques =
      podcastConfig.mixing_techniques ?? undefined;
    podcastWithCount.additional_instructions =
      podcastConfig.additional_instructions ?? undefined;
  }

  return podcastWithCount;
}

/**
 * Get podcast by ID with full configuration
 *
 * @param id - Podcast ID (UUID)
 * @returns Podcast with configuration and episode count, or null if not found
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastWithConfig('123-456');
 * if (podcast) {
 *   console.log(`${podcast.title}: ${podcast.episodes_count} episodes`);
 *   console.log(`Language: ${podcast.output_language}`);
 * }
 * ```
 */
export async function getPodcastWithConfig(
  id: string
): Promise<PodcastWithConfig | null> {
  const podcast = await dbUtils.findById<Podcast>(podcasts, podcasts.id, id);

  if (!podcast) {
    return null;
  }

  return await enrichPodcastWithConfig(podcast);
}
