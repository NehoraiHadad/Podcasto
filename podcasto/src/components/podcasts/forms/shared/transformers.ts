/**
 * Type transformers for podcast forms
 *
 * Converts between database types and form types
 */

import type { EditPodcastFormValues } from './types';
import { languageCodeToFull } from '@/lib/utils/language-mapper';

/**
 * Database podcast type (minimal for form transformation)
 */
export interface DbPodcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  image_style?: string | null;
  language_code?: string;
  auto_generation_enabled?: boolean;
  podcastConfigs?: DbPodcastConfig[];
  podcast_configs?: DbPodcastConfig[];
}

export interface DbPodcastConfig {
  podcast_format?: string;
  speaker_1_role?: string;
  speaker_2_role?: string | null;
  conversation_style?: string;
  episode_frequency?: number;
  auto_generation?: boolean;
  content_source?: string;
  telegram_channel_name?: string;
  telegram_hours?: number;
  rss_url?: string;
  intro_prompt?: string | null;
  outro_prompt?: string | null;
  creator?: string;
  podcast_name?: string;
  slogan?: string;
  creativity_level?: number;
  mixing_techniques?: string[];
  additional_instructions?: string | null;
}

/**
 * Transform database podcast object to form values
 * Handles the mismatch between DB structure and form structure
 */
export function podcastToFormValues(podcast: DbPodcast): EditPodcastFormValues {
  // Get podcast config if it exists (support both naming conventions)
  const config = podcast.podcastConfigs?.[0] || podcast.podcast_configs?.[0];

  // Convert ISO language code to full name for form
  const languageCode = podcast.language_code || 'en';
  const languageFull = languageCodeToFull(languageCode);

  const podcastFormat = config?.podcast_format || 'multi-speaker';

  return {
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    cover_image: podcast.cover_image,
    image_style: podcast.image_style,
    language: languageFull, // Now derived from podcasts.language_code
    episodeFrequency: config?.episode_frequency || 7,
    autoGeneration: podcast.auto_generation_enabled,
    podcastFormat,
    speaker1Role: config?.speaker_1_role || 'Host',
    // Only set speaker2Role default for multi-speaker, otherwise keep null
    speaker2Role: podcastFormat === 'single-speaker' ? null : (config?.speaker_2_role || 'Co-host'),
    conversationStyle: config?.conversation_style || 'casual',
    introPrompt: config?.intro_prompt,
    outroPrompt: config?.outro_prompt,
    contentSource: config?.telegram_channel_name ? 'telegram' : 'rss',
    telegramChannelName: config?.telegram_channel_name || '',
    telegramHours: config?.telegram_hours || 24,
    rssUrl: config?.rss_url || '',
    creator: config?.creator,
    podcastName: config?.podcast_name,
    slogan: config?.slogan,
    creativityLevel: config?.creativity_level !== undefined ? config.creativity_level / 100 : 0.7,
    mixingTechniques: config?.mixing_techniques || [],
    additionalInstructions: config?.additional_instructions,
  };
}

/**
 * Transform form values to database update payload
 * NOTE: This is deprecated - language is now managed via podcasts.language_code
 * and passed separately via languageCode parameter
 */
export function formValuesToPodcastUpdate(values: Partial<EditPodcastFormValues>) {
  return {
    // Podcast table fields
    title: values.title,
    description: values.description,
    cover_image: values.cover_image,
    image_style: values.image_style,

    // Podcast config fields
    config: {
      episode_frequency: values.episodeFrequency,
      podcast_format: values.podcastFormat,
      speaker1_role: values.speaker1Role,
      speaker2_role: values.speaker2Role,
      conversation_style: values.conversationStyle,
      intro_prompt: values.introPrompt,
      outro_prompt: values.outroPrompt,
      telegram_channel: values.contentSource === 'telegram' ? values.telegramChannelName : null,
      telegram_hours: values.contentSource === 'telegram' ? values.telegramHours : null,
      rss_url: values.contentSource === 'rss' ? values.rssUrl : null,
      creator: values.creator,
      slogan: values.slogan,
      creativity_level: values.creativityLevel,
      mixing_techniques: values.mixingTechniques,
      additional_instructions: values.additionalInstructions,
    },
  };
}

/**
 * Normalize content source for server actions
 * Converts 'rss' to 'urls' for backend compatibility
 *
 * @param source - Content source from form ('telegram' | 'rss')
 * @returns Normalized content source for server ('telegram' | 'urls')
 */
export function normalizeContentSource(source: 'telegram' | 'rss'): 'telegram' | 'urls' {
  return source === 'rss' ? 'urls' : source;
}
