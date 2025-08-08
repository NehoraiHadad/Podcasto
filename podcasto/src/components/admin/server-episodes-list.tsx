// Server component: no direct use of Link/Image here

import { unstable_noStore as noStore } from 'next/cache';
import { episodesApi, podcastsApi } from '@/lib/db/api';

import { sortEpisodesByDate } from '@/lib/utils/episode-utils';
import { EpisodesTableWrapper } from './episodes-table-wrapper';

// Define the expected episode type for the component
interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string | null;
  language: string | null;
  audio_url: string | null;
  duration: number | null;
  created_at: string | null;
  published_at: string | null;
  status: string | null;
  metadata: string | null;
  cover_image: string | null;
  podcast_title?: string; // Added to display podcast title
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Server component that fetches and displays a list of episodes
 */
export async function ServerEpisodesList() {
  // Opt out of caching for this component
  noStore();
  
  try {
    // Fetch episodes from the database
    const allEpisodes = await episodesApi.getAllEpisodes();
    
    // Fetch all podcasts to get their titles
    const allPodcasts = await podcastsApi.getAllPodcasts();
    const podcastsMap = new Map(allPodcasts.map(podcast => [podcast.id, podcast.title]));
    
    // Convert episodes to the expected format and sort by date
    const episodes: Episode[] = sortEpisodesByDate(
      allEpisodes.map(episode => ({
        id: episode.id,
        podcast_id: episode.podcast_id || '',
        title: episode.title,
        description: episode.description,
        language: episode.language,
        audio_url: episode.audio_url,
        duration: episode.duration,
        created_at: episode.created_at ? episode.created_at.toISOString() : null,
        published_at: episode.published_at ? episode.published_at.toISOString() : null,
        status: episode.status,
        metadata: episode.metadata,
        cover_image: episode.cover_image,
        podcast_title: episode.podcast_id ? podcastsMap.get(episode.podcast_id) || 'Unknown Podcast' : 'Unknown Podcast',
      }))
    );
    
    if (!episodes || episodes.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No episodes found.</p>
        </div>
      );
    }
    
    return <EpisodesTableWrapper episodes={episodes} />;
  } catch (error) {
    console.error('Error in ServerEpisodesList:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load episodes. Please try again later.</p>
        <p className="text-xs text-red-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
} 