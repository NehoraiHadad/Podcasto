'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { podcastsApi, podcastConfigsApi } from '@/lib/db/api';
import { createClient } from '@/lib/supabase/server';
import { userRolesApi } from '@/lib/db/api';

// Define the podcast creation schema
const podcastCreationSchema = z.object({
  // Content Source
  contentSource: z.enum(['telegram', 'urls']),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().min(1).max(72).optional(),
  urls: z.array(z.string().url().optional()).optional(),
  
  // Metadata
  title: z.string().min(3),
  creator: z.string().min(2),
  description: z.string().min(10),
  coverImage: z.string().optional(),
  
  // Basic Settings
  podcastName: z.string().min(3),
  outputLanguage: z.enum(['english', 'hebrew']),
  slogan: z.string().optional(),
  creativityLevel: z.number().min(0).max(1),
  
  // Advanced Settings
  isLongPodcast: z.boolean().default(false),
  discussionRounds: z.number().min(1).max(20).default(5),
  minCharsPerRound: z.number().min(100).max(2000).default(500),
  episodeFrequency: z.number().min(1).max(30).default(7),
  
  // Style and Roles
  conversationStyle: z.enum([
    'engaging', 'dynamic', 'enthusiastic', 'educational', 
    'casual', 'professional', 'friendly', 'formal'
  ]),
  speaker1Role: z.enum(['interviewer', 'host', 'moderator', 'guide']),
  speaker2Role: z.enum(['domain-expert', 'guest', 'expert', 'analyst']),
  
  // Mixing Techniques
  mixingTechniques: z.array(z.string()),
  
  // Additional Instructions
  additionalInstructions: z.string().optional(),
});

type PodcastCreationData = z.infer<typeof podcastCreationSchema>;

/**
 * Creates a new podcast with the provided data
 * 
 * @param data The podcast creation data
 * @returns An object with success status and error message if applicable
 */
export async function createPodcast(data: PodcastCreationData) {
  try {
    // Validate the input data
    const validatedData = podcastCreationSchema.parse(data);
    
    // Get the current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'You must be logged in to create a podcast' };
    }
    
    // Check if user has admin role using Drizzle API
    const isAdmin = await userRolesApi.isUserAdmin(user.id);
    
    if (!isAdmin) {
      return { error: 'You do not have permission to create podcasts' };
    }
    
    // Create the podcast in the database using Drizzle
    const podcast = await podcastsApi.createPodcast({
      title: validatedData.title,
      description: validatedData.description,
      cover_image: validatedData.coverImage,
    });
    
    if (!podcast) {
      console.error('Error creating podcast');
      return { error: 'Failed to create podcast in the database' };
    }
    
    // Store the podcast configuration in a separate table
    try {
      const filteredUrls = validatedData.urls
        ?.filter((url): url is string => typeof url === 'string' && url.trim() !== '')
        || [];
        
      await podcastConfigsApi.createPodcastConfig({
        podcast_id: podcast.id,
        content_source: validatedData.contentSource,
        telegram_channel: validatedData.telegramChannel,
        telegram_hours: validatedData.telegramHours,
        urls: filteredUrls,
        creator: validatedData.creator,
        podcast_name: validatedData.podcastName,
        slogan: validatedData.slogan,
        creativity_level: Math.round(validatedData.creativityLevel * 100),
        is_long_podcast: validatedData.isLongPodcast,
        discussion_rounds: validatedData.discussionRounds,
        min_chars_per_round: validatedData.minCharsPerRound,
        conversation_style: validatedData.conversationStyle,
        speaker1_role: validatedData.speaker1Role,
        speaker2_role: validatedData.speaker2Role,
        mixing_techniques: validatedData.mixingTechniques,
        additional_instructions: validatedData.additionalInstructions,
        episode_frequency: validatedData.episodeFrequency,
      });
    } catch (configError) {
      console.error('Error creating podcast configuration:', configError);
      
      // Clean up the podcast if config creation fails
      await podcastsApi.deletePodcast(podcast.id);
      
      return { error: 'Failed to create podcast configuration' };
    }
    
    // Revalidate the podcasts page
    revalidatePath('/admin/podcasts');
    
    return { success: true, podcastId: podcast.id };
  } catch (error) {
    console.error('Error in createPodcast:', error);
    
    if (error instanceof z.ZodError) {
      return { error: 'Invalid podcast data: ' + error.errors[0].message };
    }
    
    return { error: 'An unexpected error occurred' };
  }
} 