'use server';

/**
 * AWS Lambda invocation for podcast generation.
 * Handles Lambda client setup and async function invocation.
 */

import { ActionResponse } from '../schemas';
import type { LambdaInvocationParams } from './types';

/**
 * Invokes the AWS Lambda function to generate the podcast episode.
 * Sends event to Telegram Lambda which fetches content and triggers
 * audio generation via SQS.
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
