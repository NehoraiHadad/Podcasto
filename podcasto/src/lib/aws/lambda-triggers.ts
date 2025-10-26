'use server';

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { logError } from '@/lib/utils/error-utils';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TELEGRAM_LAMBDA_NAME = process.env.TELEGRAM_LAMBDA_NAME || 'podcasto-telegram-fetcher-dev';
const SCRIPT_QUEUE_URL = process.env.SCRIPT_GENERATION_QUEUE_URL || '';
const AUDIO_QUEUE_URL = process.env.AUDIO_GENERATION_QUEUE_URL || '';

/**
 * Trigger Telegram Lambda to fetch fresh data
 */
export async function triggerTelegramLambda(
  episodeId: string,
  podcastId: string,
  contentStartDate?: string,
  contentEndDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const lambdaClient = new LambdaClient({ region: AWS_REGION });

    const payload = {
      episode_id: episodeId,
      podcast_id: podcastId,
      content_start_date: contentStartDate,
      content_end_date: contentEndDate,
      regenerate: true  // Flag to indicate this is a regeneration
    };

    console.log(`[LAMBDA_TRIGGER] Invoking Telegram Lambda for episode ${episodeId}`);

    const command = new InvokeCommand({
      FunctionName: TELEGRAM_LAMBDA_NAME,
      InvocationType: 'Event',  // Async invocation
      Payload: Buffer.from(JSON.stringify(payload))
    });

    await lambdaClient.send(command);

    console.log(`[LAMBDA_TRIGGER] Successfully triggered Telegram Lambda for episode ${episodeId}`);

    return { success: true };
  } catch (error) {
    logError('triggerTelegramLambda', error);
    return {
      success: false,
      error: `Failed to trigger Telegram Lambda: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Send message to Script Generation Queue
 */
export async function triggerScriptLambda(
  episodeId: string,
  podcastId: string,
  podcastConfigId: string,
  telegramDataUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SCRIPT_QUEUE_URL) {
      return {
        success: false,
        error: 'SCRIPT_GENERATION_QUEUE_URL environment variable not set'
      };
    }

    const sqsClient = new SQSClient({ region: AWS_REGION });

    const messageBody = {
      episode_id: episodeId,
      podcast_id: podcastId,
      podcast_config_id: podcastConfigId,
      telegram_data_url: telegramDataUrl,
      regenerate: true
    };

    console.log(`[LAMBDA_TRIGGER] Sending message to Script Generation Queue for episode ${episodeId}`);

    const command = new SendMessageCommand({
      QueueUrl: SCRIPT_QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: {
        regenerate: {
          DataType: 'String',
          StringValue: 'true'
        }
      }
    });

    const response = await sqsClient.send(command);

    console.log(`[LAMBDA_TRIGGER] Successfully sent message to Script Queue. MessageId: ${response.MessageId}`);

    return { success: true };
  } catch (error) {
    logError('triggerScriptLambda', error);
    return {
      success: false,
      error: `Failed to send message to Script Queue: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Send message to Audio Generation Queue
 */
export async function triggerAudioLambda(
  episodeId: string,
  podcastId: string,
  podcastConfigId: string,
  scriptUrl: string,
  dynamicConfig: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!AUDIO_QUEUE_URL) {
      return {
        success: false,
        error: 'AUDIO_GENERATION_QUEUE_URL environment variable not set'
      };
    }

    const sqsClient = new SQSClient({ region: AWS_REGION });

    const messageBody = {
      episode_id: episodeId,
      podcast_id: podcastId,
      podcast_config_id: podcastConfigId,
      script_url: scriptUrl,
      dynamic_config: dynamicConfig,
      regenerate: true
    };

    console.log(`[LAMBDA_TRIGGER] Sending message to Audio Generation Queue for episode ${episodeId}`);

    const command = new SendMessageCommand({
      QueueUrl: AUDIO_QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: {
        regenerate: {
          DataType: 'String',
          StringValue: 'true'
        }
      }
    });

    const response = await sqsClient.send(command);

    console.log(`[LAMBDA_TRIGGER] Successfully sent message to Audio Queue. MessageId: ${response.MessageId}`);

    return { success: true };
  } catch (error) {
    logError('triggerAudioLambda', error);
    return {
      success: false,
      error: `Failed to send message to Audio Queue: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
