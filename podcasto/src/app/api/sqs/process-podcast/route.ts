import { NextRequest, NextResponse } from 'next/server';

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
    console.log(`[SQS_HANDLER] Received SQS event`);
    
    // Check authorization for internal calls
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.INTERNAL_API_KEY;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.log(`[SQS_HANDLER] Unauthorized access attempt`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse SQS event
    const sqsEvent: SQSEvent = await request.json();
    
    if (!sqsEvent.Records || sqsEvent.Records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No SQS records found' },
        { status: 400 }
      );
    }

    const results = [];
    
    // Process each SQS message
    for (const record of sqsEvent.Records) {
      try {
        // Parse message body
        const message: SQSMessage = JSON.parse(record.body);
        
        console.log(`[SQS_HANDLER] Processing message for episode: ${message.episode_id}`);
        
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
          console.log(`[SQS_HANDLER] Successfully processed episode: ${message.episode_id}`);
          results.push({
            messageId: record.messageId,
            episodeId: message.episode_id,
            status: 'success'
          });
        } else {
          console.error(`[SQS_HANDLER] Failed to process episode ${message.episode_id}: ${audioResult.error}`);
          results.push({
            messageId: record.messageId,
            episodeId: message.episode_id,
            status: 'failed',
            error: audioResult.error
          });
        }

      } catch (error) {
        console.error(`[SQS_HANDLER] Error processing SQS record:`, error);
        results.push({
          messageId: record.messageId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error(`[SQS_HANDLER] Error processing SQS event:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'SQS processing failed'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'SQS Podcast Processor',
    timestamp: new Date().toISOString()
  });
} 