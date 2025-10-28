/**
 * Configuration object builder for podcast updates.
 * Handles field mapping from input data to database format.
 */

import type { PodcastUpdateData } from '../schemas';

/**
 * Builds a config update object combining existing and new values.
 * Maps all config fields from PodcastUpdateData format to database format,
 * preserving existing values when new ones aren't provided.
 *
 * @param data - Podcast update data
 * @param existingConfig - Existing config from database or null
 * @param filteredUrls - Filtered array of valid URLs
 * @returns Config update object ready for database operation
 */
export function buildConfigUpdateObject(
  data: PodcastUpdateData,
  existingConfig: Record<string, unknown> | null,
  filteredUrls: string[]
) {
  // Create update object with podcast ID
  const updateConfig: Record<string, unknown> = {
    podcast_id: data.id
  };

  // Map fields from data to config object, preserving existing values when new ones aren't provided
  const fieldMappings: Record<string, { dataKey: string, configKey: string }> = {
    contentSource: { dataKey: 'contentSource', configKey: 'content_source' },
    telegramChannel: { dataKey: 'telegramChannel', configKey: 'telegram_channel' },
    telegramHours: { dataKey: 'telegramHours', configKey: 'telegram_hours' },
    creator: { dataKey: 'creator', configKey: 'creator' },
    podcastName: { dataKey: 'podcastName', configKey: 'podcast_name' },
    slogan: { dataKey: 'slogan', configKey: 'slogan' },
    // NOTE: language field removed - now using podcasts.language_code
    conversationStyle: { dataKey: 'conversationStyle', configKey: 'conversation_style' },
    podcastFormat: { dataKey: 'podcastFormat', configKey: 'podcast_format' },
    speaker1Role: { dataKey: 'speaker1Role', configKey: 'speaker1_role' },
    speaker2Role: { dataKey: 'speaker2Role', configKey: 'speaker2_role' },
    additionalInstructions: { dataKey: 'additionalInstructions', configKey: 'additional_instructions' },
    episodeFrequency: { dataKey: 'episodeFrequency', configKey: 'episode_frequency' },
  };

  // Apply all field mappings
  Object.entries(fieldMappings).forEach(([_, { dataKey, configKey }]) => {
    try {
      const dataValue = data[dataKey as keyof PodcastUpdateData];
      const existingValue = existingConfig?.[configKey];

      // Only add the field if the value is not undefined and not null
      if (dataValue !== undefined && dataValue !== null) {
        updateConfig[configKey] = dataValue;
      } else if (existingValue !== undefined && existingValue !== null) {
        updateConfig[configKey] = existingValue;
      }
    } catch (err) {
      console.error(`Error mapping field ${dataKey}:`, err);
    }
  });

  // Handle special cases

  // Always include URLs if they exist
  updateConfig.urls = filteredUrls.length > 0 ? filteredUrls : existingConfig?.urls || [];

  // Handle creativity level (needs to be scaled)
  if (data.creativityLevel !== undefined && data.creativityLevel !== null) {
    updateConfig.creativity_level = Math.round(data.creativityLevel * 100);
  } else if (existingConfig?.creativity_level !== undefined && existingConfig?.creativity_level !== null) {
    updateConfig.creativity_level = existingConfig.creativity_level;
  }


  // Handle array fields
  if (data.mixingTechniques && Array.isArray(data.mixingTechniques) && data.mixingTechniques.length > 0) {
    updateConfig.mixing_techniques = data.mixingTechniques.filter(Boolean) as string[];
  } else if (existingConfig?.mixing_techniques && Array.isArray(existingConfig.mixing_techniques)) {
    updateConfig.mixing_techniques = existingConfig.mixing_techniques;
  } else {
    updateConfig.mixing_techniques = ['rhetorical-questions', 'personal-anecdotes']; // Default values
  }

  // Handle podcast format logic: clear speaker2_role for single-speaker podcasts
  if (updateConfig.podcast_format === 'single-speaker') {
    updateConfig.speaker2_role = null;
  }

  return updateConfig;
}
