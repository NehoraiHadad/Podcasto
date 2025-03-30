import { NextRequest, NextResponse } from 'next/server';
import { episodesApi } from '@/lib/db/api';

/**
 * API route to check podcast generation status
 * Accepts podcastId in params and episodeId in query params (with timestamp fallback for compatibility)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ podcastId: string }> }
) {
  try {
    const { podcastId } = await params;
    
    if (!podcastId) {
      return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 });
    }
    
    // Get the episodeId from query params (preferred) or timestamp (for compatibility)
    const searchParams = request.nextUrl.searchParams;
    const episodeId = searchParams.get('episodeId');
    const timestamp = searchParams.get('timestamp');
    
    if (!episodeId && !timestamp) {
      return NextResponse.json({ error: 'Episode ID or timestamp is required' }, { status: 400 });
    }
    
    // Try to find the episode directly by ID (most efficient)
    let targetEpisode = null;
    
    if (episodeId) {
      targetEpisode = await episodesApi.getEpisodeById(episodeId);
    }
    
    // Fall back to timestamp-based lookup for backward compatibility
    if (!targetEpisode && timestamp) {
      // Get all episodes for this podcast
      const podcastEpisodes = await episodesApi.getEpisodesByPodcastId(podcastId);
      
      // Find the episode with matching timestamp in metadata
      for (const episode of podcastEpisodes) {
        if (episode.metadata) {
          try {
            const metadata = JSON.parse(episode.metadata);
            if (metadata.generation_timestamp === timestamp) {
              targetEpisode = episode;
              break;
            }
          } catch {
            // Skip episodes with invalid metadata
            continue;
          }
        }
      }
    }
    
    if (!targetEpisode) {
      return NextResponse.json(
        { error: 'Episode not found', status: 'unknown' },
        { status: 404 }
      );
    }
    
    const status = targetEpisode.status || 'pending';
    let message = 'Podcast generation is in progress.';
    
    // Set appropriate message based on the status
    if (status === 'pending') {
      message = 'Podcast generation is in progress.';
    } else if (status === 'completed') {
      message = 'Podcast generation complete.';
    } else if (status === 'error') {
      message = 'Podcast generation failed.';
    } else {
      // Custom status
      message = `Podcast status: ${status}`;
    }
    
    
    return NextResponse.json({ 
      podcastId, 
      episodeId: targetEpisode.id,
      timestamp: timestamp,
      status, 
      message,
      lastChecked: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking podcast status:', error);
    return NextResponse.json(
      { error: 'Failed to check podcast status', status: 'unknown' },
      { status: 500 }
    );
  }
} 