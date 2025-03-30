import { db, episodes } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, not, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Status constants
const PENDING_STATUS = 'pending';
const COMPLETED_STATUS = 'completed';
const FAILED_STATUS = 'failed';

// Time constants (in milliseconds)
const MAX_PENDING_TIME = 30 * 60 * 1000; // 30 minutes

// Define the results type to avoid TypeScript errors
interface EpisodeCheckResults {
  checked: number;
  timed_out: number;
  completed: number;
  errors: string[];
}

/**
 * Checks for episodes that have been pending for too long and marks them as failed
 * Also checks for episodes that have completed and triggers any necessary follow-up actions
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
    
    // 2. Find all pending episodes
    console.log('[EPISODE_CHECKER] Querying for pending episodes');
    const pendingEpisodes = await db.select()
      .from(episodes)
      .where(eq(episodes.status, PENDING_STATUS));
    
    console.log(`[EPISODE_CHECKER] Found ${pendingEpisodes.length} pending episodes`);
    
    // 3. Process pending episodes
    const now = new Date();
    const results: EpisodeCheckResults = {
      checked: pendingEpisodes.length,
      timed_out: 0,
      completed: 0,
      errors: []
    };
    
    for (const episode of pendingEpisodes) {
      console.log(`[EPISODE_CHECKER] Processing episode: ${episode.id}, title: ${episode.title}`);
      
      try {
        // Check if the episode has been pending for too long
        if (episode.created_at) {
          const pendingTime = now.getTime() - new Date(episode.created_at).getTime();
          console.log(`[EPISODE_CHECKER] Episode pending time: ${pendingTime}ms (max: ${MAX_PENDING_TIME}ms)`);
          
          // If pending for more than MAX_PENDING_TIME (30 minutes), mark as failed
          if (pendingTime > MAX_PENDING_TIME) {
            console.log(`[EPISODE_CHECKER] Episode ${episode.id} timed out, marking as failed`);
            await db.update(episodes)
              .set({ 
                status: FAILED_STATUS,
                description: 'Episode generation timed out'
              })
              .where(eq(episodes.id, episode.id));
            
            results.timed_out++;
            continue;
          }
        }
        
        // Check if this episode has been completed but status wasn't updated
        console.log(`[EPISODE_CHECKER] Checking audio URL for episode ${episode.id}: "${episode.audio_url}"`);
        
        if (episode.audio_url && episode.audio_url !== '') {
          console.log(`[EPISODE_CHECKER] Episode ${episode.id} has audio URL but status is still "${episode.status}", updating to completed`);
          
          await db.update(episodes)
            .set({ 
              status: COMPLETED_STATUS,
              description: 'Episode generated successfully'
            })
            .where(eq(episodes.id, episode.id));
          
          results.completed++;
          
          // Revalidate relevant paths to update the UI
          console.log(`[EPISODE_CHECKER] Revalidating UI paths for episode ${episode.id}`);
          revalidatePath('/admin/podcasts');
          revalidatePath(`/podcasts/${episode.podcast_id}`);
        } else {
          console.log(`[EPISODE_CHECKER] Episode ${episode.id} still pending, no action needed`);
        }
      } catch (error) {
        console.error(`[EPISODE_CHECKER] Error processing episode ${episode.id}:`, error);
        results.errors.push(`Episode ${episode.id}: ${error?.toString() || 'Unknown error'}`);
      }
    }
    
    // 4. Look for any episodes that have audio_url but status isn't "completed"
    console.log('[EPISODE_CHECKER] Checking for inconsistent episodes (audio URL exists but status not completed)');
    
    const inconsistentEpisodes = await db.select()
      .from(episodes)
      .where(
        and(
          not(eq(episodes.status, COMPLETED_STATUS)),
          not(eq(episodes.status, FAILED_STATUS)),
          not(eq(episodes.audio_url, '')),
          not(isNull(episodes.audio_url))
        )
      );
    
    console.log(`[EPISODE_CHECKER] Found ${inconsistentEpisodes.length} inconsistent episodes`);
    
    for (const episode of inconsistentEpisodes) {
      console.log(`[EPISODE_CHECKER] Fixing inconsistent episode ${episode.id}, setting status to completed`);
      
      await db.update(episodes)
        .set({ status: COMPLETED_STATUS })
        .where(eq(episodes.id, episode.id));
      
      results.completed++;
      
      // Revalidate paths
      revalidatePath('/admin/podcasts');
      revalidatePath(`/podcasts/${episode.podcast_id}`);
    }
    
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