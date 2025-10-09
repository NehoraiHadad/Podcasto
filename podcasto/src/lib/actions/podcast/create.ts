'use server';

import { podcastsApi, podcastConfigsApi } from '@/lib/db/api';
import { 
  PodcastCreationData, 
  SimplePodcastData, 
  ActionResponse, 
  podcastCreationSchema, 
  simplePodcastSchema 
} from './schemas';
import { requireAdmin } from './auth';
import { filterUrls, handleActionError, revalidatePodcastPaths } from './utils';

/**
 * Creates a new podcast with the provided data
 * 
 * @param data The podcast creation data
 * @returns An object with success status and error message if applicable
 */
export async function createPodcast(data: PodcastCreationData): Promise<ActionResponse> {
  try {
    // Validate the input data
    const validatedData = podcastCreationSchema.parse(data);
    
    // Check if user has admin role 
    await requireAdmin();
    
    // Create the podcast in the database 
    const podcast = await podcastsApi.createPodcast({
      title: validatedData.title,
      description: validatedData.description,
      cover_image: validatedData.coverImage,
    });
    
    if (!podcast) {
      return { success: false, error: 'Failed to create podcast in the database' };
    }
    
    // Store the podcast configuration
    await createPodcastConfig(podcast.id, validatedData);
    
    // Revalidate the podcasts page
    revalidatePodcastPaths();
    
    return { success: true, id: podcast.id };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Creates podcast configuration for a newly created podcast
 * 
 * @param podcastId ID of the created podcast
 * @param data Validated podcast creation data
 */
async function createPodcastConfig(podcastId: string, data: PodcastCreationData) {
  try {
    const filteredUrls = await filterUrls(data.urls as string[]);
      
    await podcastConfigsApi.createPodcastConfig({
      podcast_id: podcastId,
      content_source: data.contentSource,
      telegram_channel: data.telegramChannel,
      telegram_hours: data.telegramHours,
      urls: filteredUrls,
      creator: data.creator,
      podcast_name: data.podcastName,
      slogan: data.slogan,
      language: data.outputLanguage,
      creativity_level: Math.round(data.creativityLevel * 100),
      is_long_podcast: data.isLongPodcast,
      discussion_rounds: data.discussionRounds,
      min_chars_per_round: data.minCharsPerRound,
      conversation_style: data.conversationStyle,
      speaker1_role: data.speaker1Role,
      speaker2_role: data.speaker2Role,
      mixing_techniques: data.mixingTechniques,
      additional_instructions: data.additionalInstructions,
      script_generation_prompt: data.scriptGenerationPrompt,
      episode_frequency: data.episodeFrequency,
    });
    
    return true;
  } catch {
    // Clean up the podcast if config creation fails
    await podcastsApi.deletePodcast(podcastId);
    throw new Error('Failed to create podcast configuration');
  }
}

/**
 * Creates a simpler podcast with basic metadata
 */
export async function createSimplePodcast(data: SimplePodcastData): Promise<ActionResponse> {
  try {
    // Validate the input data
    const validatedData = simplePodcastSchema.parse(data);
    
    // Check if the user has admin permissions
    await requireAdmin();
    
    // Validate required fields
    if (!validatedData.title || validatedData.title.trim().length < 3) {
      return {
        success: false,
        error: 'Title is required and must be at least 3 characters',
      };
    }
    
    // Check if a podcast with the same title already exists
    const exists = await podcastsApi.podcastExistsByTitle(validatedData.title);
    if (exists) {
      return {
        success: false,
        error: 'A podcast with this title already exists',
      };
    }
    
    // Create the podcast in the database
    const podcast = await podcastsApi.createPodcast({
      title: validatedData.title,
      description: validatedData.description,
      cover_image: validatedData.cover_image,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    // Revalidate cached paths
    revalidatePodcastPaths();
    
    return { 
      success: true,
      id: podcast.id,
    };
  } catch (error) {
    return handleActionError(error);
  }
} 