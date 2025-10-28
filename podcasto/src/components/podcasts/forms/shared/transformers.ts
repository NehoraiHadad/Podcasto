/**
 * Type transformers for podcast forms
 *
 * Converts between database types and form types
 */

import type { EditPodcastFormValues } from './types';
import { languageCodeToFull } from '@/lib/utils/language-mapper';

/**
 * Transform database podcast object to form values
 * Handles the mismatch between DB structure and form structure
 */
export function podcastToFormValues(podcast: any): EditPodcastFormValues {
  // Get podcast config if it exists (support both naming conventions)
  const config = podcast.podcastConfigs?.[0] || podcast.podcast_configs?.[0];

  // Convert ISO language code to full name for form
  const languageCode = podcast.language_code || 'en';
  const languageFull = languageCodeToFull(languageCode);

  return {
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    cover_image: podcast.cover_image,
    image_style: podcast.image_style,
    language: languageFull, // Now derived from podcasts.language_code
    episodeFrequency: config?.episode_frequency || 7,
    autoGeneration: podcast.auto_generation,
    podcastFormat: config?.podcast_format || 'multi-speaker',
    speaker1Role: config?.speaker1_role || 'Host',
    speaker2Role: config?.speaker2_role || 'Co-host',
    conversationStyle: config?.conversation_style || 'casual',
    introPrompt: config?.intro_prompt,
    outroPrompt: config?.outro_prompt,
    contentSource: config?.telegram_channel ? 'telegram' : 'rss',
    telegramChannelName: config?.telegram_channel || '',
    telegramHours: config?.telegram_hours || 24,
    rssUrl: config?.rss_url || '',
    creator: config?.creator,
    podcastName: podcast.podcast_name,
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
