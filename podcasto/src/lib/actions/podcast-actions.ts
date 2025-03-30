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

/**
 * Triggers immediate podcast generation for a specific podcast.
 * 
 * @param podcastId - The ID of the podcast to generate
 * @returns Object with success/error information
 */
export async function generatePodcastEpisode(podcastId: string) {
  'use server';
  
  try {
    // Validate the podcast ID
    if (!podcastId) {
      return { error: 'Podcast ID is required' };
    }
    
    console.log(`[PODCAST_GEN] Starting generation for podcast ID: ${podcastId}`);
    
    // Import AWS SDK
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    
    // Create Lambda client
    const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    
    // Get the Lambda function name from environment variables
    const telegramLambdaName = process.env.TELEGRAM_LAMBDA_NAME;
    const sqsQueueUrl = process.env.SQS_QUEUE_URL;
    
    console.log(`[PODCAST_GEN] Using Lambda function: ${telegramLambdaName}`);
    console.log(`[PODCAST_GEN] Using SQS queue: ${sqsQueueUrl}`);
    
    if (!telegramLambdaName) {
      console.error('TELEGRAM_LAMBDA_NAME environment variable not set');
      return { error: 'Server configuration error: Lambda function name not set' };
    }
    
    if (!sqsQueueUrl) {
      console.error('SQS_QUEUE_URL environment variable not set');
      return { error: 'Server configuration error: SQS queue URL not set' };
    }
    
    // Fetch the podcast configuration
    const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);
    
    if (!podcastConfig) {
      console.error(`[PODCAST_GEN] Podcast configuration not found for ID: ${podcastId}`);
      return { error: 'Podcast configuration not found' };
    }
    
    console.log(`[PODCAST_GEN] Found podcast config: ${JSON.stringify(podcastConfig, null, 2)}`);
    
    // Create a new episode record with 'pending' status - IMPORTANT: Do this BEFORE invoking Lambda
    const timestamp = new Date().toISOString();
    let episode;
    
    try {
      // Create a new episode record with 'pending' status
      const { episodesApi } = await import('@/lib/db/api');
      
      episode = await episodesApi.createEpisode({
        podcast_id: podcastId,
        title: `Episode ${new Date().toLocaleDateString()}`,
        description: 'Processing...',
        audio_url: '', // Empty URL initially
        status: 'pending',
        duration: 0,
        language: 'english', // Default to English
        metadata: JSON.stringify({
          generation_timestamp: timestamp,
          s3_key: `podcasts/${podcastId}/${timestamp}/podcast.mp3`
        })
      });
      
      console.log(`[PODCAST_GEN] Created pending episode: ${episode.id}`);
    } catch (error) {
      console.error(`[PODCAST_GEN] Error creating episode: ${error}`);
      return { error: 'Failed to create episode record' };
    }
    
    // Prepare the event payload - include the episode ID we just created
    const payload = {
      podcast_config: podcastConfig,
      podcast_id: podcastId,  // Pass the actual podcast ID explicitly 
      episode_id: episode.id, // Pass the episode ID explicitly 
      sqs_queue_url: sqsQueueUrl,
      trigger_source: "admin-panel"
    };
    
    console.log(`[PODCAST_GEN] Invoking Lambda with payload: ${JSON.stringify(payload, null, 2)}`);
    
    // Invoke the Lambda function
    const command = new InvokeCommand({
      FunctionName: telegramLambdaName,
      Payload: JSON.stringify(payload),
      InvocationType: 'Event'
    });
    
    console.log(`[PODCAST_GEN] Sending Lambda command`);
    const response = await lambdaClient.send(command);
    console.log(`[PODCAST_GEN] Lambda response received, status: ${response.StatusCode}`);
    
    // For Event invocations, the StatusCode is the main thing we check
    if (response.StatusCode === 202) {  // 202 Accepted means the async invocation was accepted
      // Revalidate the podcasts page to show the updated status
      revalidatePath('/admin/podcasts');
      
      // Return success with episode information
      return { 
        success: true, 
        message: 'Podcast generation has been triggered',
        timestamp: timestamp,
        episodeId: episode.id
      };
    }
    
    console.error(`[PODCAST_GEN] Lambda invocation failed with status: ${response.StatusCode}`);
    return { error: 'Failed to trigger podcast generation' };
  } catch (error) {
    console.error('Error in generatePodcastEpisode:', error);
    return { error: 'Failed to trigger podcast generation' };
  }
} 