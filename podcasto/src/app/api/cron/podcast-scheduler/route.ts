import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { PodcastScheduleData } from '@/lib/podcast-scheduler/types';
import { findPodcastsNeedingEpisodes } from '@/lib/podcast-scheduler/finder';
import { generateEpisodesForPodcasts } from '@/lib/podcast-scheduler/generator';

export async function GET(request: NextRequest) {
  try {
    console.log('[PODCAST_SCHEDULER] Endpoint called');
    
    // 1. Verify this is a legitimate cron request
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[PODCAST_SCHEDULER] Authorization failed', { 
        secretConfigured: !!cronSecret,
        headerProvided: !!authHeader
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[PODCAST_SCHEDULER] Authorization successful');
    
    // 2. Find podcasts that need new episodes
    let podcastsNeedingEpisodes: PodcastScheduleData[] = [];
    
    try {
      podcastsNeedingEpisodes = await findPodcastsNeedingEpisodes();
    } catch (findError) {
      console.error('[PODCAST_SCHEDULER] Error in finding podcasts:', findError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding podcasts needing episodes',
        details: findError instanceof Error ? findError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    if (podcastsNeedingEpisodes.length === 0) {
      console.log('[PODCAST_SCHEDULER] No podcasts need new episodes');
      return NextResponse.json({
        success: true,
        message: 'No podcasts need new episodes',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[PODCAST_SCHEDULER] Found ${podcastsNeedingEpisodes.length} podcasts needing episodes`);
    
    // 3. Generate episodes for each podcast
    let results = [];
    
    try {
      results = await generateEpisodesForPodcasts(podcastsNeedingEpisodes);
    } catch (generateError) {
      console.error('[PODCAST_SCHEDULER] Error in generating episodes:', generateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error generating podcast episodes',
        details: generateError instanceof Error ? generateError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // 4. Revalidate paths
    try {
      revalidatePath('/admin/podcasts');
      revalidatePath('/podcasts');
    } catch (revalidateError) {
      console.warn('[PODCAST_SCHEDULER] Error revalidating paths:', revalidateError);
      // Continue despite revalidation errors
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated episodes for ${results.filter(r => r.success).length}/${podcastsNeedingEpisodes.length} podcasts`,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[PODCAST_SCHEDULER] Unhandled error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 