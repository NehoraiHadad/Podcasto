import { NextRequest, NextResponse } from 'next/server';
import { episodesApi } from '@/lib/db/api';
import { getPostProcessingService } from '@/lib/episode-checker/service-factory';

/**
 * Lambda completion callback endpoint
 * Called by audio-generation-lambda when episode processing is completed
 * Triggers immediate post-processing (title/summary generation, image creation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  const logPrefix = '[LAMBDA_CALLBACK]';
  
  try {
    console.log(`${logPrefix} Completion callback received for episode: ${episodeId}`);
    
    // 1. Verify Lambda authentication
    const authHeader = request.headers.get('Authorization');
    const lambdaSecret = process.env.LAMBDA_CALLBACK_SECRET;
    
    if (!lambdaSecret || authHeader !== `Bearer ${lambdaSecret}`) {
      console.error(`${logPrefix} Unauthorized callback attempt for episode ${episodeId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Parse callback payload
    const payload = await request.json();
    const { status, audio_url, duration } = payload;
    
    console.log(`${logPrefix} Callback payload:`, { 
      episodeId, 
      status, 
      audio_url: audio_url ? 'present' : 'missing',
      duration 
    });
    
    // 3. Verify episode exists and has expected status
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      console.error(`${logPrefix} Episode ${episodeId} not found`);
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }
    
    if (!episode.podcast_id) {
      console.error(`${logPrefix} Episode ${episodeId} has no podcast_id`);
      return NextResponse.json({ error: 'Episode has no podcast_id' }, { status: 400 });
    }
    
    // 4. Verify episode is in completed status (should be updated by Lambda)
    if (episode.status !== 'completed') {
      console.warn(`${logPrefix} Episode ${episodeId} status is ${episode.status}, expected 'completed'`);
      // Continue anyway - Lambda might have updated status after our query
    }
    
    // 5. Check if post-processing is enabled
    const postProcessingEnabled = process.env.ENABLE_POST_PROCESSING === 'true';
    if (!postProcessingEnabled) {
      console.log(`${logPrefix} Post-processing disabled, skipping for episode ${episodeId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Callback received, post-processing disabled' 
      });
    }
    
    // 6. Get post-processing service
    const postProcessingService = getPostProcessingService();
    if (!postProcessingService) {
      console.error(`${logPrefix} Post-processing service not available`);
      return NextResponse.json({ 
        success: false, 
        error: 'Post-processing service not available' 
      }, { status: 500 });
    }
    
    // 7. Trigger immediate post-processing
    console.log(`${logPrefix} Starting immediate post-processing for episode ${episodeId}`);
    
    const processingResult = await postProcessingService.processCompletedEpisode(
      episode.podcast_id,
      episodeId,
      {
        forceReprocess: false, // Don't force reprocess
        skipTitleGeneration: false,
        skipSummaryGeneration: false,
        skipImageGeneration: false
      }
    );
    
    if (processingResult.success) {
      console.log(`${logPrefix} Post-processing completed successfully for episode ${episodeId}`);
      
      // 8. Revalidate paths to update UI immediately
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/admin/podcasts');
      revalidatePath(`/podcasts/${episode.podcast_id}`);
      revalidatePath(`/podcasts/${episode.podcast_id}/episodes/${episodeId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Episode post-processing completed successfully',
        episode: processingResult.episode
      });
    } else {
      console.error(`${logPrefix} Post-processing failed for episode ${episodeId}: ${processingResult.message}`);
      return NextResponse.json({
        success: false,
        error: `Post-processing failed: ${processingResult.message}`
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error(`${logPrefix} Error processing callback for episode ${episodeId}:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET method for health check / testing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params;
  
  // Simple health check - verify episode exists
  try {
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Callback endpoint is ready',
      episode: {
        id: episode.id,
        status: episode.status,
        podcast_id: episode.podcast_id
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 