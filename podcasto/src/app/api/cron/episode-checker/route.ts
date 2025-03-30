import { db, episodes } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createPostProcessingService } from '@/lib/services/post-processing';

// Status constants
const PENDING_STATUS = 'pending';
const COMPLETED_STATUS = 'completed';  // There is an audio file but it has not yet been AI processed
const FAILED_STATUS = 'failed';
const PROCESSED_STATUS = 'processed';  // AI processing has been completed

// Time constants (in milliseconds)
const MAX_PENDING_TIME = 30 * 60 * 1000; // 30 minutes

// Define the results type to avoid TypeScript errors
interface EpisodeCheckResults {
  checked: number;
  timed_out: number;
  completed: number;
  processed: number;
  requires_processing: number;
  errors: string[];
}

// Initialize post-processing service if environment variables are available
function getPostProcessingService() {
  const aiApiKey = process.env.GEMINI_API_KEY;
  const s3Region = process.env.AWS_S3_REGION;
  const s3Bucket = process.env.AWS_S3_BUCKET;
  const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  // Check if required environment variables are available
  if (!aiApiKey || !s3Region || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
    console.error('[EPISODE_CHECKER] Missing required environment variables for post-processing');
    return null;
  }
  
  // Create and return the post-processing service
  return createPostProcessingService({
    s3: {
      region: s3Region,
      bucket: s3Bucket,
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
    ai: {
      provider: 'gemini',
      apiKey: aiApiKey,
    },
  });
}

/**
 * Checks for episodes that have been pending for too long and marks them as failed.
 * Also processes any episodes that have completed audio generation but haven't been processed yet.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[EPISODE_CHECKER] Endpoint called');
    
    // 1. Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('[EPISODE_CHECKER] Checking authorization. Auth header exists:', !!authHeader);
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[EPISODE_CHECKER] Authorization failed:', { 
        secretConfigured: !!cronSecret,
        headerProvided: !!authHeader
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[EPISODE_CHECKER] Authorization successful');
    
    // Results tracking
    const results: EpisodeCheckResults = {
      checked: 0,
      timed_out: 0,
      completed: 0,
      processed: 0,
      requires_processing: 0,
      errors: []
    };
    
    // Get post-processing service if enabled
    const postProcessingEnabled = process.env.ENABLE_POST_PROCESSING === 'true';
    const postProcessingService = postProcessingEnabled ? getPostProcessingService() : null;
    
    console.log(`[EPISODE_CHECKER] Post-processing ${postProcessingEnabled ? 'enabled' : 'disabled'}, service ${postProcessingService ? 'available' : 'unavailable'}`);
    
    // Consolidated check instead of 3 separate checks
    await processAllEpisodes(postProcessingService, postProcessingEnabled, results);
    
    console.log('[EPISODE_CHECKER] Completed check with results:', JSON.stringify(results, null, 2));
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('[EPISODE_CHECKER] Error in episode-checker:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.toString() || 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * Process all episodes that need attention in a single DB call
 */
async function processAllEpisodes(
  postProcessingService: ReturnType<typeof createPostProcessingService> | null,
  postProcessingEnabled: boolean,
  results: EpisodeCheckResults
) {
  const now = new Date();
  const timeoutThreshold = new Date(now.getTime() - MAX_PENDING_TIME);
  
  // Step 1: Get all episodes that need attention in one query
  console.log('[EPISODE_CHECKER] Fetching episodes that need attention');
  
  // Note: Drizzle does not support direct OR like regular SQL, so we need to do more than one query
  // But we can combine PENDING with/without audio
  const pendingEpisodes = await db.select()
    .from(episodes)
    .where(eq(episodes.status, PENDING_STATUS));
  
  const completedEpisodes = postProcessingEnabled ? 
    await db.select()
      .from(episodes)
      .where(eq(episodes.status, COMPLETED_STATUS)) : 
    [];
  
  results.checked = pendingEpisodes.length + completedEpisodes.length;
  
  if (results.checked === 0) {
    console.log('[EPISODE_CHECKER] No episodes need attention');
    return;
  }
  
  console.log(`[EPISODE_CHECKER] Found ${pendingEpisodes.length} pending and ${completedEpisodes.length} completed episodes to check`);
  
  // Step 2: Process all episodes
  // 2a: Find timed out episodes and mark them as failed
  for (const episode of pendingEpisodes) {
    try {
      // Check if pending for too long
      if (episode.created_at && new Date(episode.created_at) < timeoutThreshold) {
        await db.update(episodes)
          .set({ 
            status: FAILED_STATUS,
            description: 'Episode generation timed out'
          })
          .where(eq(episodes.id, episode.id));
        
        results.timed_out++;
        console.log(`[EPISODE_CHECKER] Episode ${episode.id} timed out, marked as failed`);
        continue;
      }
      
      // Check if has audio URL but still pending
      if (episode.audio_url && episode.audio_url !== '') {
        await db.update(episodes)
          .set({ 
            status: COMPLETED_STATUS,
            description: 'Audio generated successfully, awaiting post-processing'
          })
          .where(eq(episodes.id, episode.id));
        
        results.completed++;
        console.log(`[EPISODE_CHECKER] Episode ${episode.id} has audio, marked as completed`);
        
        // Revalidate paths
        if (episode.podcast_id) {
          revalidatePath('/admin/podcasts');
          revalidatePath(`/podcasts/${episode.podcast_id}`);
        }
        
        // If post-processing is enabled, add it to the completed list for processing
        if (postProcessingEnabled && postProcessingService && episode.podcast_id) {
          // Use existing handling later
          completedEpisodes.push(episode);
        }
      }
    } catch (error) {
      console.error(`[EPISODE_CHECKER] Error processing pending episode ${episode.id}:`, error);
      results.errors.push(`Error processing episode ${episode.id}: ${error?.toString() || 'Unknown error'}`);
    }
  }
  
  // 2b: Process completed episodes if post-processing is enabled
  if (postProcessingEnabled && postProcessingService && completedEpisodes.length > 0) {
    console.log(`[EPISODE_CHECKER] Processing ${completedEpisodes.length} completed episodes`);
    
    for (const episode of completedEpisodes) {
      if (!episode.podcast_id) {
        console.warn(`[EPISODE_CHECKER] Episode ${episode.id} has no podcast_id, skipping processing`);
        continue;
      }
      
      try {
        console.log(`[EPISODE_CHECKER] Processing episode ${episode.id}`);
        const success = await postProcessingService.processCompletedEpisode({
          id: episode.id,
          podcast_id: episode.podcast_id,
          metadata: episode.metadata
        });
        
        if (success) {
          // Update episode status to 'processed'
          await db.update(episodes)
            .set({ status: PROCESSED_STATUS })
            .where(eq(episodes.id, episode.id));
          
          results.processed++;
          console.log(`[EPISODE_CHECKER] Successfully post-processed episode ${episode.id}`);
          
          // Revalidate paths
          revalidatePath('/admin/podcasts');
          revalidatePath(`/podcasts/${episode.podcast_id}`);
        } else {
          console.error(`[EPISODE_CHECKER] Failed to post-process episode ${episode.id}`);
          results.errors.push(`Failed to post-process episode ${episode.id}`);
        }
      } catch (error) {
        console.error(`[EPISODE_CHECKER] Error in post-processing for episode ${episode.id}:`, error);
        results.errors.push(`Post-processing error for episode ${episode.id}: ${error?.toString() || 'Unknown error'}`);
      }
    }
  }
} 