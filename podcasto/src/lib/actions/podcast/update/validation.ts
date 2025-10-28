/**
 * Validation utilities for podcast update operations.
 * Checks for config field presence and validates update data.
 */

import type { PodcastUpdateData } from '../schemas';

/**
 * Checks if the podcast update data contains any configuration fields.
 * Config fields include content source, Telegram settings, URLs, language,
 * conversation style, and other podcast generation parameters.
 *
 * @param data - Podcast update data to check
 * @returns True if any config fields are present, false otherwise
 */
export function hasConfigFields(data: PodcastUpdateData): boolean {
  return !!(
    data.contentSource || data.telegramChannel || data.telegramHours || data.urls ||
    data.creator || data.podcastName || data.languageCode || data.slogan ||
    data.creativityLevel !== undefined || data.episodeFrequency ||
    data.conversationStyle || data.speaker1Role || data.speaker2Role ||
    data.mixingTechniques || data.additionalInstructions
  );
}
