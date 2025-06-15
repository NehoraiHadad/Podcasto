import { NextRequest, NextResponse } from 'next/server';
import { episodesApi } from '@/lib/db/api';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

interface GenerateAudioRequest {
  episodeId: string;
  podcastId: string;
  telegramDataPath?: string;
  s3Path?: string;
  timestamp?: string;
}

/**
 * GET method - Manual trigger for CRON jobs
 * Finds pending episodes and sends them to AWS Lambda via existing SQS queue
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('[AUDIO_TRIGGER] Manual trigger started - checking auth');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log('[AUDIO_TRIGGER] Auth failed:', { hasSecret: !!cronSecret, hasAuth: !!authHeader });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[AUDIO_TRIGGER] Auth successful, finding pending episodes');

    // Find episodes that have content collected and need audio generation
    const pendingEpisodes = await episodesApi.getEpisodesByStatus(['content_collected']);
    
    console.log(`[AUDIO_TRIGGER] Found ${pendingEpisodes?.length || 0} episodes with content_collected status`);
    
    if (!pendingEpisodes || pendingEpisodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No episodes with content_collected status found',
        timestamp: new Date().toISOString(),
        processed: 0,
        errors: 0,
        results: []
      });
    }

    console.log(`[AUDIO_TRIGGER] Episodes to process:`, pendingEpisodes.map(e => ({ id: e.id, title: e.title, status: e.status })));

    // Send episodes to existing SQS for processing by Lambda
    const results = await sendEpisodesToSQS(pendingEpisodes);

    return NextResponse.json({
      success: true,
      message: `Sent ${results.successful} episodes to processing queue`,
      timestamp: new Date().toISOString(),
      processed: results.successful,
      errors: results.failed,
      results: results.details
    });

  } catch (error) {
    console.error('[AUDIO_TRIGGER] Error in manual trigger:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Manual trigger failed'
      },
      { status: 500 }
    );
  }
}

/**
 * POST method - Individual episode trigger
 * Sends a specific episode to AWS Lambda via existing SQS queue
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let episodeId: string | undefined;

  try {
    // Parse request body
    const body: GenerateAudioRequest = await request.json();
    episodeId = body.episodeId;

    if (!episodeId) {
      return NextResponse.json(
        { success: false, error: 'Episode ID is required' },
        { status: 400 }
      );
    }

    console.log(`[AUDIO_TRIGGER] Starting audio generation trigger for episode: ${episodeId}`);

    // Get episode data
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 }
      );
    }

    if (!episode.podcast_id) {
      return NextResponse.json(
        { success: false, error: 'Episode podcast_id is missing' },
        { status: 400 }
      );
    }

    // Send single episode to existing SQS  
    const result = await sendEpisodeToSQS({
      id: episode.id,
      title: episode.title,
      podcast_id: episode.podcast_id!
    }, body.s3Path);

    const processingTime = Date.now() - startTime;
    console.log(`[AUDIO_TRIGGER] Successfully triggered audio generation for episode ${episodeId} in ${processingTime}ms`);

    return NextResponse.json({
      success: result.success,
      episodeId,
      message: result.success ? 'Episode sent to processing queue' : 'Failed to send episode to queue',
      processingTime,
      sqsMessageId: result.messageId
    });

  } catch (error) {
    console.error(`[AUDIO_TRIGGER] Error triggering audio generation:`, error);

    // Update episode status to 'failed' if we have an episode ID
    if (episodeId) {
      try {
        await updateEpisodeStatus(episodeId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      } catch (updateError) {
        console.error(`[AUDIO_TRIGGER] Failed to update episode status:`, updateError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Audio generation trigger failed'
      },
      { status: 500 }
    );
  }
}

/**
 * Send multiple episodes to existing SQS for processing
 */
async function sendEpisodesToSQS(episodes: Array<{ id: string; title: string; podcast_id: string | null }>) {
  let successful = 0;
  let failed = 0;
  const details = [];

  console.log(`[AUDIO_TRIGGER] Sending ${episodes.length} episodes to existing SQS queue`);

  for (const episode of episodes) {
    try {
      if (!episode.podcast_id) {
        console.error(`[AUDIO_TRIGGER] Episode ${episode.id} missing podcast_id`);
        failed++;
        details.push({
          episodeId: episode.id,
          success: false,
          error: 'Missing podcast_id'
        });
        continue;
      }

      console.log(`[AUDIO_TRIGGER] Sending episode to SQS: ${episode.id} - ${episode.title}`);
      
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
        console.log(`[AUDIO_TRIGGER] Successfully sent episode ${episode.id} to SQS`);
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
      console.error(`[AUDIO_TRIGGER] Error sending episode ${episode.id} to SQS:`, error);
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

  console.log(`[AUDIO_TRIGGER] SQS sending completed. Successful: ${successful}, Failed: ${failed}`);

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
async function sendEpisodeToSQS(
  episode: { id: string; title: string; podcast_id: string },
  s3Path?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
    console.error(`[AUDIO_TRIGGER] SQS send error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SQS error'
    };
  }
}

/**
 * Updates episode status and optionally error message
 */
async function updateEpisodeStatus(
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
  console.log(`[AUDIO_TRIGGER] Updated episode ${episodeId} status to: ${status}`);
} 