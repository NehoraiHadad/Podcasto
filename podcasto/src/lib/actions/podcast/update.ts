'use server';

import { podcastsApi, podcastConfigsApi } from '@/lib/db/api';
import { 
  ActionResponse,
  PodcastUpdateData, 
  podcastUpdateSchema 
} from './schemas';
import { requireAdmin } from './auth';
import { 
  filterUrls, 
  handleActionError, 
  revalidatePodcastPaths, 
  checkTitleConflict 
} from './utils';

/**
 * Updates an existing podcast
 */
export async function updatePodcast(data: PodcastUpdateData): Promise<ActionResponse> {
  try {
    console.log("Received update data:", JSON.stringify(data, null, 2));
    
    // Validate the input data
    try {
      const validatedData = podcastUpdateSchema.parse(data);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      // Check if the user has admin permissions
      await requireAdmin();
      
      // Validate required fields
      if (!validatedData.title || validatedData.title.trim().length < 3) {
        return {
          success: false,
          error: 'Title is required and must be at least 3 characters',
        };
      }
      
      // Check for title conflicts with other podcasts
      const existingPodcasts = await podcastsApi.getAllPodcasts();
      const titleConflict = await checkTitleConflict(
        existingPodcasts, 
        validatedData.title, 
        validatedData.id
      );
      
      if (titleConflict) {
        return {
          success: false,
          error: titleConflict
        };
      }
      
      try {
        // Update the podcast basic data
        const updatedPodcast = await updatePodcastMetadata(validatedData);
        
        if (!updatedPodcast) {
          return {
            success: false,
            error: 'Failed to update podcast metadata',
          };
        }
        
        // Update podcast configuration if any config fields are provided
        if (hasConfigFields(validatedData)) {
          console.log("Updating podcast config...");
          const configUpdateResult = await updatePodcastConfig(validatedData);
          
          if (!configUpdateResult.success) {
            console.error("Config update failed:", configUpdateResult.error);
            return configUpdateResult;
          }
        }
        
        // Revalidate cached paths
        revalidatePodcastPaths(validatedData.id);
        
        return { success: true };
      } catch (databaseError) {
        console.error("Database operation error:", databaseError);
        return {
          success: false,
          error: databaseError instanceof Error ? 
            `Database error: ${databaseError.message}` : 
            'Error updating podcast in database'
        };
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return {
        success: false,
        error: validationError instanceof Error ? 
          `Validation error: ${validationError.message}` : 
          'Error validating podcast data'
      };
    }
  } catch (error) {
    console.error("Podcast update error:", error);
    return handleActionError(error);
  }
}

/**
 * Updates the basic podcast metadata
 */
async function updatePodcastMetadata({
  id,
  title,
  description,
  cover_image
}: PodcastUpdateData) {
  return await podcastsApi.updatePodcast(id, {
    title,
    description,
    cover_image,
    updated_at: new Date()
  });
}

/**
 * Checks if the podcast update data contains config fields
 */
function hasConfigFields(data: PodcastUpdateData): boolean {
  return !!(
    data.contentSource || data.telegramChannel || data.telegramHours || data.urls ||
    data.creator || data.podcastName || data.outputLanguage || data.slogan ||
    data.creativityLevel !== undefined || data.isLongPodcast !== undefined ||
    data.discussionRounds || data.minCharsPerRound || data.episodeFrequency ||
    data.conversationStyle || data.speaker1Role || data.speaker2Role ||
    data.mixingTechniques || data.additionalInstructions || data.scriptGenerationPrompt
  );
}

/**
 * Builds and updates podcast configuration
 */
async function updatePodcastConfig(data: PodcastUpdateData): Promise<ActionResponse> {
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
          is_long_podcast: data.isLongPodcast ?? false,
          discussion_rounds: data.discussionRounds || 5,
          min_chars_per_round: data.minCharsPerRound || 500,
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

/**
 * Builds a config update object combining existing and new values
 */
function buildConfigUpdateObject(
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
    outputLanguage: { dataKey: 'outputLanguage', configKey: 'language' },
    conversationStyle: { dataKey: 'conversationStyle', configKey: 'conversation_style' },
    speaker1Role: { dataKey: 'speaker1Role', configKey: 'speaker1_role' },
    speaker2Role: { dataKey: 'speaker2Role', configKey: 'speaker2_role' },
    additionalInstructions: { dataKey: 'additionalInstructions', configKey: 'additional_instructions' },
    scriptGenerationPrompt: { dataKey: 'scriptGenerationPrompt', configKey: 'script_generation_prompt' },
    episodeFrequency: { dataKey: 'episodeFrequency', configKey: 'episode_frequency' },
  };
  
  // Apply all field mappings
  Object.entries(fieldMappings).forEach(([_, { dataKey, configKey }]) => {
    try {
      const dataValue = data[dataKey as keyof PodcastUpdateData];
      const existingValue = existingConfig?.[configKey];
      
      // Add debug logging for language field
      if (dataKey === 'outputLanguage') {
        console.log(`Mapping outputLanguage: dataValue=${dataValue}, existingValue=${existingValue}`);
      }
      
      // Only add the field if the value is not undefined and not null
      if (dataValue !== undefined && dataValue !== null) {
        updateConfig[configKey] = dataValue;
        if (dataKey === 'outputLanguage') {
          console.log(`Set ${configKey}=${dataValue} from input data`);
        }
      } else if (existingValue !== undefined && existingValue !== null) {
        updateConfig[configKey] = existingValue;
        if (dataKey === 'outputLanguage') {
          console.log(`Set ${configKey}=${existingValue} from existing config`);
        }
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
  
  // Handle boolean fields
  if (data.isLongPodcast !== undefined) {
    updateConfig.is_long_podcast = data.isLongPodcast;
  } else if (existingConfig?.is_long_podcast !== undefined) {
    updateConfig.is_long_podcast = existingConfig.is_long_podcast;
  }
  
  // Handle numeric fields
  if (data.discussionRounds !== undefined && data.discussionRounds !== null) {
    updateConfig.discussion_rounds = data.discussionRounds;
  } else if (existingConfig?.discussion_rounds !== undefined && existingConfig?.discussion_rounds !== null) {
    updateConfig.discussion_rounds = existingConfig.discussion_rounds;
  }
  
  if (data.minCharsPerRound !== undefined && data.minCharsPerRound !== null) {
    updateConfig.min_chars_per_round = data.minCharsPerRound;
  } else if (existingConfig?.min_chars_per_round !== undefined && existingConfig?.min_chars_per_round !== null) {
    updateConfig.min_chars_per_round = existingConfig.min_chars_per_round;
  }
  
  // Handle array fields
  if (data.mixingTechniques && Array.isArray(data.mixingTechniques) && data.mixingTechniques.length > 0) {
    updateConfig.mixing_techniques = data.mixingTechniques.filter(Boolean) as string[];
  } else if (existingConfig?.mixing_techniques && Array.isArray(existingConfig.mixing_techniques)) {
    updateConfig.mixing_techniques = existingConfig.mixing_techniques;
  } else {
    updateConfig.mixing_techniques = ['rhetorical-questions', 'personal-anecdotes']; // Default values
  }
  
  return updateConfig;
} 