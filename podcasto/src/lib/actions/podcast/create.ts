'use server';

import { podcastsApi, podcastConfigsApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth';
import {
  PodcastCreationData,
  SimplePodcastData,
  ActionResponse,
  podcastCreationSchema,
  simplePodcastSchema
} from './schemas';
import { filterUrls, handleActionError, revalidatePodcastPaths } from './utils';
import { handleMessagePreCheck } from './generation/message-check-handler';
import { ChannelAccessStatus } from '@/lib/services/telegram/types';

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
    const user = await requireAdmin();

    // Create the podcast in the database
    const podcast = await podcastsApi.createPodcast({
      title: validatedData.title,
      description: validatedData.description,
      cover_image: validatedData.coverImage,
      image_style: validatedData.imageStyle,
      language_code: validatedData.languageCode, // ISO language code from form
      created_by: user?.id,
    });
    
    if (!podcast) {
      return { success: false, error: 'Failed to create podcast in the database' };
    }
    
    // Store the podcast configuration
    await createPodcastConfig(podcast.id, validatedData);

    // If Telegram channel configured, check accessibility
    let channelWarning: string | undefined;
    if (validatedData.telegramChannel) {
      try {
        const checkResult = await handleMessagePreCheck(
          podcast.id,
          validatedData.telegramChannel,
          7, // Check last 7 days
          'unknown' // Initial status
        );

        if (checkResult.accessStatus === ChannelAccessStatus.NO_PREVIEW) {
          channelWarning = `Channel "${validatedData.telegramChannel}" doesn't allow public message previews. Episode generation will rely on authenticated Lambda access. Make sure the Telegram account has joined this channel.`;
        } else if (checkResult.accessStatus === ChannelAccessStatus.NOT_FOUND) {
          channelWarning = `Channel "${validatedData.telegramChannel}" was not found or is completely private. Please verify the channel name and accessibility.`;
        }
      } catch (error) {
        console.error('[CREATE_PODCAST] Error checking channel accessibility:', error);
        // Non-blocking - don't fail podcast creation
      }
    }

    // Revalidate the podcasts page
    revalidatePodcastPaths();

    return {
      success: true,
      id: podcast.id,
      warning: channelWarning
    };
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
      // NOTE: language removed - now using podcasts.language_code instead
      creativity_level: Math.round(data.creativityLevel * 100),
      conversation_style: data.conversationStyle,
      podcast_format: data.podcastFormat,
      speaker1_role: data.speaker1Role,
      speaker2_role: data.podcastFormat === 'single-speaker' ? null : data.speaker2Role,
      mixing_techniques: data.mixingTechniques,
      additional_instructions: data.additionalInstructions,
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
    const user = await requireAdmin();

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
      image_style: validatedData.image_style,
      created_by: user?.id,
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