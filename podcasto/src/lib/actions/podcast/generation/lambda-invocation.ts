'use server';

/**
 * AWS Lambda invocation for podcast generation.
 * Handles Lambda client setup and async function invocation.
 */

import { ActionResponse } from '../schemas';
import type { LambdaInvocationParams } from './types';
import {
  determinePodcastFormat,
  updateSequenceStateIfNeeded,
  type PodcastConfigForFormat,
} from '@/lib/services/podcast-format';

/**
 * Invokes the AWS Lambda function to generate the podcast episode.
 * Determines podcast format based on strategy, updates DB if needed,
 * and sends event to Telegram Lambda with pre-determined format.
 *
 * @param params - Lambda invocation parameters including IDs and config
 * @returns ActionResponse indicating Lambda invocation success or failure
 */
export async function invokeLambdaFunction({
  podcastId,
  episodeId,
  podcastConfig,
  dateRange
}: LambdaInvocationParams): Promise<ActionResponse> {
  try {
    // Determine podcast format based on strategy
    console.log(`[PODCAST_GEN] Determining podcast format for episode ${episodeId}`);
    const formatResult = determinePodcastFormat(podcastConfig as PodcastConfigForFormat);
    const podcastFormat = formatResult.podcast_format;

    console.log(
      `[PODCAST_GEN] Format determined: ${podcastFormat} ` +
      `(strategy: ${(podcastConfig as PodcastConfigForFormat).speaker_selection_strategy || 'fixed'})`
    );

    // Update sequence state in DB if needed (sequence strategy only)
    if (formatResult.sequence_state) {
      console.log(
        `[PODCAST_GEN] Updating sequence state: ` +
        `next_type=${formatResult.sequence_state.next_type}, ` +
        `next_progress=${formatResult.sequence_state.next_progress}`
      );
      await updateSequenceStateIfNeeded(podcastId, formatResult);
    }

    // Import AWS SDK
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');

    // Create Lambda client
    const lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION || (() => {
        throw new Error('AWS_REGION environment variable is required');
      })()
    });

    // Prepare the event payload with pre-determined format
    const payload = {
      podcast_config: podcastConfig,
      podcast_id: podcastId,
      episode_id: episodeId,
      podcast_format: podcastFormat, // Pre-determined format
      sqs_queue_url: process.env.SQS_QUEUE_URL,
      date_range: dateRange ? {
        start_date: dateRange.startDate.toISOString(),
        end_date: dateRange.endDate.toISOString()
      } : null,
      trigger_source: "admin-panel"
    };

    console.log(`[PODCAST_GEN] Invoking Lambda with format: ${podcastFormat}`);

    // Invoke the Lambda function
    const command = new InvokeCommand({
      FunctionName: process.env.TELEGRAM_LAMBDA_NAME!,
      Payload: JSON.stringify(payload),
      InvocationType: 'Event'
    });

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
      error: error instanceof Error ? error.message : 'Error invoking Lambda function'
    };
  }
}
