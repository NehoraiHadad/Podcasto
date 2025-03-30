import { db, episodes } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, not, or, isNull } from 'drizzle-orm';
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
    // 1. Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Find all pending episodes
    const pendingEpisodes = await db.select()
      .from(episodes)
      .where(eq(episodes.status, PENDING_STATUS));
    
    // 3. Process pending episodes
    const now = new Date();
    const results: EpisodeCheckResults = {
      checked: pendingEpisodes.length,
      timed_out: 0,
      completed: 0,
      errors: []
    };
    
    for (const episode of pendingEpisodes) {
      try {
        // Check if the episode has been pending for too long
        if (episode.created_at) {
          const pendingTime = now.getTime() - new Date(episode.created_at).getTime();
          
          // If pending for more than MAX_PENDING_TIME (30 minutes), mark as failed
          if (pendingTime > MAX_PENDING_TIME) {
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
        // This logic could vary based on how your Lambda updates completed episodes
        // For example, checking if audio_url is populated but status is still pending
        if (episode.audio_url && episode.audio_url !== '') {
          await db.update(episodes)
            .set({ 
              status: COMPLETED_STATUS,
              description: 'Episode generated successfully'
            })
            .where(eq(episodes.id, episode.id));
          
          results.completed++;
          
          // Perform any follow-up actions needed when an episode completes
          // For example: send notifications, update podcast metadata, etc.
          
          // Revalidate relevant paths to update the UI
          revalidatePath('/admin/podcasts');
          revalidatePath(`/podcasts/${episode.podcast_id}`);
        }
      } catch (error) {
        console.error(`Error processing episode ${episode.id}:`, error);
        results.errors.push(`Episode ${episode.id}: ${error?.toString() || 'Unknown error'}`);
      }
    }
    
    // 4. Look for any episodes that have audio_url but status isn't "completed"
    // This handles cases where Lambda set the audio_url but failed to update status
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
    
    for (const episode of inconsistentEpisodes) {
      await db.update(episodes)
        .set({ status: COMPLETED_STATUS })
        .where(eq(episodes.id, episode.id));
      
      results.completed++;
      
      // Revalidate paths
      revalidatePath('/admin/podcasts');
      revalidatePath(`/podcasts/${episode.podcast_id}`);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('Error in episode-checker:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.toString() || 'Unknown error' 
    }, { status: 500 });
  }
} 