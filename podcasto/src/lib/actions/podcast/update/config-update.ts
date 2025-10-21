'use server';

/**
 * Podcast configuration update operations.
 * Handles config database operations and required field defaults.
 */

import { podcastConfigsApi } from '@/lib/db/api';
import { ActionResponse, PodcastUpdateData } from '../schemas';
import { filterUrls } from '../utils';
import { buildConfigUpdateObject } from './config-builder';

/**
 * Builds and updates podcast configuration in the database.
 * Handles both new config creation and existing config updates.
 *
 * @param data - Podcast update data containing config fields
 * @returns ActionResponse indicating success or error
 */
export async function updatePodcastConfig(data: PodcastUpdateData): Promise<ActionResponse> {
  try {
    // Filter empty URLs
    const filteredUrls = await filterUrls(data.urls?.filter(Boolean) as string[]);

    // Get existing podcast config
    const existingConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(data.id);

    // Log the input data for debugging
    console.log("Updating podcast config with data:", {
      id: data.id,
      outputLanguage: data.outputLanguage
    });

    // Build the update config object
    const updateConfig = buildConfigUpdateObject(data, existingConfig, filteredUrls);
    console.log("Built config object:", JSON.stringify(updateConfig, null, 2));

    // Update or create the config
    try {
      if (existingConfig) {
        await podcastConfigsApi.updatePodcastConfigByPodcastId(data.id, updateConfig);
        console.log("Updated existing podcast config, language field =", updateConfig.language);
      } else {
        // For new configs, ensure required fields are present
        const requiredFields = {
          content_source: data.contentSource || 'telegram',
          creator: data.creator || 'Unknown',
          podcast_name: data.podcastName || data.title,
          language: data.outputLanguage || 'english',
          creativity_level: data.creativityLevel !== undefined ? Math.round(data.creativityLevel * 100) : 70,
          conversation_style: data.conversationStyle || 'engaging',
          speaker1_role: data.speaker1Role || 'host',
          speaker2_role: data.speaker2Role || 'expert',
          mixing_techniques: (data.mixingTechniques?.filter(Boolean) as string[]) || ['rhetorical-questions', 'personal-anecdotes'],
        };

        await podcastConfigsApi.createPodcastConfig({
          ...updateConfig,
          ...requiredFields
        });
      }

      return { success: true };
    } catch (configError) {
      console.error("Error updating or creating podcast config:", configError);
      return {
        success: false,
        error: configError instanceof Error ? configError.message : 'Failed to update podcast configuration',
      };
    }
  } catch (error) {
    console.error('Error updating podcast configuration:', error);
    return {
      success: false,
      error: 'Failed to update podcast configuration',
    };
  }
}
