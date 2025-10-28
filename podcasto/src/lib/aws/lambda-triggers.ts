'use server';

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { logError } from '@/lib/utils/error-utils';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SCRIPT_QUEUE_URL = process.env.SCRIPT_GENERATION_QUEUE_URL || '';
const AUDIO_QUEUE_URL = process.env.AUDIO_GENERATION_QUEUE_URL || '';

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
  dynamicConfig: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!AUDIO_QUEUE_URL) {
      return {
        success: false,
        error: 'AUDIO_GENERATION_QUEUE_URL environment variable not set'
      };
    }

    const sqsClient = new SQSClient({ region: AWS_REGION });

    // Include podcast_format in the message body for Lambda processing
    const messageBody = {
      episode_id: episodeId,
      podcast_id: podcastId,
      podcast_config_id: podcastConfigId,
      script_url: scriptUrl,
      dynamic_config: {
        ...dynamicConfig,
        // Ensure podcast_format is included from dynamic_config
        podcast_format: dynamicConfig.podcast_format || 'multi-speaker'
      },
      regenerate: true
    };

    console.log(`[LAMBDA_TRIGGER] Sending message to Audio Generation Queue for episode ${episodeId}`);
    console.log(`[LAMBDA_TRIGGER] Podcast format: ${messageBody.dynamic_config.podcast_format}`);

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
