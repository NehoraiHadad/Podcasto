import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { episodesApi } from '@/lib/db/api';
import { logError } from '@/lib/api';
import type { EpisodeForSQS, SQSSendResult, BatchSQSResult } from './types';

const logPrefix = '[AUDIO_TRIGGER]';

/**
 * Send multiple episodes to existing SQS for processing
 */
export async function sendEpisodesToSQS(
  episodes: Array<{ id: string; title: string; podcast_id: string | null }>
): Promise<BatchSQSResult> {
  let successful = 0;
  let failed = 0;
  const details = [];

  console.log(`${logPrefix} Sending ${episodes.length} episodes to existing SQS queue`);

  for (const episode of episodes) {
    try {
      if (!episode.podcast_id) {
        console.error(`${logPrefix} Episode ${episode.id} missing podcast_id`);
        failed++;
        details.push({
          episodeId: episode.id,
          success: false,
          error: 'Missing podcast_id'
        });
        continue;
      }

      console.log(`${logPrefix} Sending episode to SQS: ${episode.id} - ${episode.title}`);

      const result = await sendEpisodeToSQS({
        id: episode.id,
        title: episode.title,
        podcast_id: episode.podcast_id!
      });

      if (result.success) {
        successful++;
        details.push({
          episodeId: episode.id,
          success: true,
          messageId: result.messageId
        });
        console.log(`${logPrefix} Successfully sent episode ${episode.id} to SQS`);
      } else {
        failed++;
        details.push({
          episodeId: episode.id,
          success: false,
          error: result.error
        });
        await updateEpisodeStatus(episode.id, 'failed', result.error || 'Failed to send to SQS');
      }

    } catch (error) {
      logError(logPrefix, error, { episodeId: episode.id, context: 'Batch SQS send' });
      failed++;
      details.push({
        episodeId: episode.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update episode status to failed
      await updateEpisodeStatus(episode.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  console.log(`${logPrefix} SQS sending completed. Successful: ${successful}, Failed: ${failed}`);

  return {
    successful,
    failed,
    details
  };
}

/**
 * Send individual episode to existing SQS queue
 * Uses the same format as telegram-lambda SQS messages
 */
export async function sendEpisodeToSQS(
  episode: EpisodeForSQS,
  s3Path?: string
): Promise<SQSSendResult> {
  try {
    // Initialize SQS client
    const sqsClient = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Use the existing SQS queue (same as telegram-lambda)
    const queueUrl = process.env.SQS_QUEUE_URL;
    if (!queueUrl) {
      throw new Error('SQS_QUEUE_URL environment variable not set');
    }

    // Prepare SQS message in the same format as telegram-lambda
    // This ensures the audio generation lambda can distinguish these messages
    const messageBody = {
      podcast_config_id: episode.podcast_id,
      podcast_id: episode.podcast_id,
      episode_id: episode.id,
      timestamp: new Date().toISOString(),
      s3_path: s3Path || '', // Optional S3 path for Telegram data
      content_url: s3Path || '', // Same as s3_path for compatibility
      trigger_source: 'audio_generation_manual' // Identifier for audio generation requests
    };

    // Send message to existing SQS queue
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: {
        'episode_id': {
          DataType: 'String',
          StringValue: episode.id
        },
        'podcast_id': {
          DataType: 'String',
          StringValue: episode.podcast_id
        },
        'trigger_source': {
          DataType: 'String',
          StringValue: 'audio_generation_manual'
        }
      }
    });

    const response = await sqsClient.send(command);

    return {
      success: true,
      messageId: response.MessageId
    };

  } catch (error) {
    logError(logPrefix, error, { episodeId: episode.id, context: 'SQS send' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SQS error'
    };
  }
}

/**
 * Updates episode status and optionally error message
 */
export async function updateEpisodeStatus(
  episodeId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
) {
  const updateData: { status: string; metadata?: string } = { status };

  if (status === 'failed' && errorMessage) {
    // Store error in metadata
    const episode = await episodesApi.getEpisodeById(episodeId);
    const metadata = episode?.metadata ? JSON.parse(episode.metadata) : {};
    metadata.error = errorMessage;
    metadata.failed_at = new Date().toISOString();
    updateData.metadata = JSON.stringify(metadata);
  }

  await episodesApi.updateEpisode(episodeId, updateData);
  console.log(`${logPrefix} Updated episode ${episodeId} status to: ${status}`);
}
