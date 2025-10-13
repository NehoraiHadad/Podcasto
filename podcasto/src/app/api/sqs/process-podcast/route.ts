import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  validateBearerToken,
  logError,
} from '@/lib/api';

interface SQSMessage {
  podcast_config_id: string;
  podcast_id: string;
  timestamp: string;
  episode_id: string;
  s3_path: string;
  content_url: string;
}

interface SQSEvent {
  Records: Array<{
    body: string;
    messageId: string;
    receiptHandle: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    logError('[SQS_HANDLER]', 'Received SQS event', { severity: 'info' });

    // Validate authorization for internal calls (optional if INTERNAL_API_KEY not configured)
    const internalKey = process.env.INTERNAL_API_KEY;

    if (internalKey) {
      const authResult = validateBearerToken(request, internalKey);
      if (!authResult.valid) {
        logError('[SQS_HANDLER]', 'Unauthorized access attempt', { severity: 'warn' });
        return apiError('Unauthorized', 401);
      }
    }

    // Parse SQS event
    const sqsEvent: SQSEvent = await request.json();

    if (!sqsEvent.Records || sqsEvent.Records.length === 0) {
      return apiError('No SQS records found', 400);
    }

    const results = [];

    // Process each SQS message
    for (const record of sqsEvent.Records) {
      try {
        // Parse message body
        const message: SQSMessage = JSON.parse(record.body);

        logError('[SQS_HANDLER]', `Processing message for episode: ${message.episode_id}`, {
          severity: 'info',
          episodeId: message.episode_id,
        });

        // Call our audio generation API
        const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/episodes/generate-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` // For internal calls
          },
          body: JSON.stringify({
            episodeId: message.episode_id,
            podcastId: message.podcast_id,
            s3Path: message.s3_path,
            timestamp: message.timestamp
          })
        });

        const audioResult = await audioResponse.json();

        if (audioResult.success) {
          logError('[SQS_HANDLER]', `Successfully processed episode: ${message.episode_id}`, {
            severity: 'info',
            episodeId: message.episode_id,
          });
          results.push({
            messageId: record.messageId,
            episodeId: message.episode_id,
            status: 'success'
          });
        } else {
          logError('[SQS_HANDLER]', `Failed to process episode ${message.episode_id}`, {
            error: audioResult.error,
            episodeId: message.episode_id,
          });
          results.push({
            messageId: record.messageId,
            episodeId: message.episode_id,
            status: 'failed',
            error: audioResult.error
          });
        }

      } catch (error) {
        logError('[SQS_HANDLER]', error, {
          messageId: record.messageId,
          context: 'Processing SQS record',
        });
        results.push({
          messageId: record.messageId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return apiSuccess({
      processed: results.length,
      results
    });

  } catch (error) {
    logError('[SQS_HANDLER]', error, {
      context: 'Processing SQS event',
    });
    return apiError(error instanceof Error ? error : 'SQS processing failed', 500);
  }
}

// Health check endpoint
export async function GET() {
  return apiSuccess({
    status: 'healthy',
    service: 'SQS Podcast Processor',
    timestamp: new Date().toISOString()
  });
} 