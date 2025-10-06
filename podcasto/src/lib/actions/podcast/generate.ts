'use server';

import { podcastConfigsApi } from '@/lib/db/api';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './schemas';

/**
 * Interface for date range selection
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Interface for the result of podcast generation
 */
interface GenerationResult extends ActionResponse {
  message?: string;
  timestamp?: string;
  episodeId?: string;
}

/**
 * Triggers immediate podcast generation for a specific podcast.
 *
 * @param podcastId - The ID of the podcast to generate
 * @param dateRange - Optional date range for content collection
 * @returns Object with success/error information
 */
export async function generatePodcastEpisode(
  podcastId: string,
  dateRange?: DateRange
): Promise<GenerationResult> {
  try {
    // Validate the podcast ID
    if (!podcastId) {
      return { success: false, error: 'Podcast ID is required' };
    }

    // Validate date range if provided
    if (dateRange) {
      const validationResult = validateDateRange(dateRange);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    // Log the generation request
    console.log(`[PODCAST_GEN] Starting generation for podcast ID: ${podcastId}`);
    if (dateRange) {
      console.log(`[PODCAST_GEN] Using custom date range: ${dateRange.startDate.toISOString()} to ${dateRange.endDate.toISOString()}`);
    }
    
    // Check environment configuration
    const envCheck = checkEnvironmentConfiguration();
    if (!envCheck.success) {
      return envCheck;
    }
    
    // Get podcast config for generation parameters
    const configResult = await fetchPodcastConfig(podcastId);
    if (!configResult.success || !configResult.config) {
      return { success: false, error: configResult.error || 'Failed to get podcast config' };
    }
    
    // Create a new episode record
    const timestamp = new Date().toISOString();
    const episodeResult = await createPendingEpisode(podcastId, timestamp, dateRange);
    if (!episodeResult.success) {
      return episodeResult;
    }
    
    // Invoke Telegram Lambda to collect data and trigger processing via SQS
    const lambdaResult = await invokeLambdaFunction({
      podcastId,
      episodeId: episodeResult.episodeId!,
      podcastConfig: configResult.config,
      timestamp,
      dateRange
    });
    
    if (!lambdaResult.success) {
      return lambdaResult;
    }
    
    // Revalidate the podcasts page to show the updated status
    revalidatePath('/admin/podcasts');
    
    return { 
      success: true, 
      message: 'Podcast generation has been triggered',
      timestamp,
      episodeId: episodeResult.episodeId
    };
  } catch (error) {
    console.error('Error in generatePodcastEpisode:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to trigger podcast generation' 
    };
  }
}

/**
 * Checks that all required environment variables are set
 */
function checkEnvironmentConfiguration(): ActionResponse {
  // Get the Lambda function name from environment variables
  const telegramLambdaName = process.env.TELEGRAM_LAMBDA_NAME;
  const sqsQueueUrl = process.env.SQS_QUEUE_URL;
  
  console.log(`[PODCAST_GEN] Using Lambda function: ${telegramLambdaName}`);
  console.log(`[PODCAST_GEN] Using SQS queue: ${sqsQueueUrl}`);
  
  if (!telegramLambdaName) {
    console.error('TELEGRAM_LAMBDA_NAME environment variable not set');
    return { 
      success: false, 
      error: 'Server configuration error: Lambda function name not set' 
    };
  }
  
  if (!sqsQueueUrl) {
    console.error('SQS_QUEUE_URL environment variable not set');
    return { 
      success: false, 
      error: 'Server configuration error: SQS queue URL not set' 
    };
  }
  
  return { success: true };
}

/**
 * Fetches and validates podcast configuration
 */
async function fetchPodcastConfig(podcastId: string): Promise<ActionResponse & { config?: Record<string, unknown> }> {
  const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);
  
  if (!podcastConfig) {
    console.error(`[PODCAST_GEN] Podcast configuration not found for ID: ${podcastId}`);
    return { 
      success: false, 
      error: 'Podcast configuration not found' 
    };
  }
  
  console.log(`[PODCAST_GEN] Found podcast config: ${JSON.stringify(podcastConfig, null, 2)}`);
  
  return { 
    success: true, 
    config: podcastConfig 
  };
}

/**
 * Creates a pending episode record
 */
async function createPendingEpisode(
  podcastId: string,
  timestamp: string,
  dateRange?: DateRange
): Promise<ActionResponse & { episodeId?: string }> {
  try {
    // Create a new episode record with 'pending' status
    const { episodesApi, podcastConfigsApi } = await import('@/lib/db/api');
    
    // Get podcast config to retrieve language
    const podcastConfig = await podcastConfigsApi.getPodcastConfigByPodcastId(podcastId);
    const language = podcastConfig?.language || 'english'; // Default to English if not set
    
    const episode = await episodesApi.createEpisode({
      podcast_id: podcastId,
      title: `Episode ${new Date().toLocaleDateString()}`,
      description: 'Processing...',
      audio_url: '', // Empty URL initially
      status: 'pending',
      duration: 0,
      language: language,
      content_start_date: dateRange?.startDate,
      content_end_date: dateRange?.endDate,
      metadata: JSON.stringify({
        generation_timestamp: timestamp,
        s3_key: `podcasts/${podcastId}/${timestamp}/podcast.mp3`,
        date_range: dateRange ? {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString()
        } : null
      })
    });
    
    console.log(`[PODCAST_GEN] Created pending episode: ${episode.id}`);
    
    return { 
      success: true, 
      episodeId: episode.id 
    };
  } catch (error) {
    console.error(`[PODCAST_GEN] Error creating episode: ${error}`);
    return { 
      success: false, 
      error: 'Failed to create episode record' 
    };
  }
}

/**
 * Invokes the AWS Lambda function to generate the podcast episode
 */
async function invokeLambdaFunction({
  podcastId,
  episodeId,
  podcastConfig,
  dateRange
}: {
  podcastId: string;
  episodeId: string;
  podcastConfig: Record<string, unknown>;
  timestamp: string;
  dateRange?: DateRange;
}): Promise<ActionResponse> {
  try {
    // Import AWS SDK
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    
    // Create Lambda client
    const lambdaClient = new LambdaClient({ 
              region: process.env.AWS_REGION || (() => {
          throw new Error('AWS_REGION environment variable is required');
        })() 
    });
    
    // Prepare the event payload - include the episode ID we just created
    const payload = {
      podcast_config: podcastConfig,
      podcast_id: podcastId,  // Pass the actual podcast ID explicitly
      episode_id: episodeId, // Pass the episode ID explicitly
      sqs_queue_url: process.env.SQS_QUEUE_URL,
      // Add date_range if provided
      date_range: dateRange ? {
        start_date: dateRange.startDate.toISOString(),
        end_date: dateRange.endDate.toISOString()
      } : null,
      trigger_source: "admin-panel"
    };
    
    console.log(`[PODCAST_GEN] Invoking Lambda with payload: ${JSON.stringify(payload, null, 2)}`);
    
    // Invoke the Lambda function
    const command = new InvokeCommand({
      FunctionName: process.env.TELEGRAM_LAMBDA_NAME!,
      Payload: JSON.stringify(payload),
      InvocationType: 'Event'
    });
    
    console.log(`[PODCAST_GEN] Sending Lambda command`);
    const response = await lambdaClient.send(command);
    console.log(`[PODCAST_GEN] Lambda response received, status: ${response.StatusCode}`);
    
    // For Event invocations, the StatusCode is the main thing we check
    if (response.StatusCode === 202) {  // 202 Accepted means the async invocation was accepted
      return { success: true };
    }
    
    console.error(`[PODCAST_GEN] Lambda invocation failed with status: ${response.StatusCode}`);
    return { 
      success: false, 
      error: 'Failed to trigger podcast generation' 
    };
  } catch (error) {
    console.error(`[PODCAST_GEN] Lambda invocation error: ${error}`);
    return { 
      success: false, 
      error: 'Error invoking Lambda function'
    };
  }
}

/**
 * Validates date range for episode generation
 */
function validateDateRange(dateRange: DateRange): ActionResponse {
  const { startDate, endDate } = dateRange;

  // Check that start date is before end date
  if (startDate >= endDate) {
    return {
      success: false,
      error: 'Start date must be before end date'
    };
  }

  // Check that dates are not in the future
  const now = new Date();
  if (startDate > now) {
    return {
      success: false,
      error: 'Start date cannot be in the future'
    };
  }

  if (endDate > now) {
    return {
      success: false,
      error: 'End date cannot be in the future'
    };
  }

  // Check that range is not too large (max 30 days)
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 30) {
    return {
      success: false,
      error: 'Date range cannot exceed 30 days'
    };
  }

  return { success: true };
} 