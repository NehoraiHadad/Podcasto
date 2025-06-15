import Link from 'next/link';
import Image from 'next/image';

import { unstable_noStore as noStore } from 'next/cache';
import { episodesApi, podcastsApi } from '@/lib/db/api';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EpisodeActionsMenu } from './episode-actions-menu';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { sortEpisodesByDate } from '@/lib/utils/episode-utils';

// Define the expected episode type for the component
interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string | null;
  language: string | null;
  audio_url: string;
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
    
    // Format duration from seconds to mm:ss
    const formatDuration = (durationInSeconds: number | null): string => {
      if (!durationInSeconds) return 'Unknown';
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = durationInSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    // Format status with badge
    const renderStatus = (status: string | null) => {
      if (!status) return <Badge variant="outline">Unknown</Badge>;
      
      switch (status.toLowerCase()) {
        case 'published':
          return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Published</Badge>;
        case 'pending':
          return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
        case 'processing':
          return <Badge variant="secondary">Processing</Badge>;
        case 'failed':
          return <Badge variant="destructive">Failed</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };
    
    return (
      <div className="space-y-4">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Podcast</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {episodes.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell>
                    {episode.cover_image ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-md">
                        <Image 
                          src={episode.cover_image} 
                          alt={`${episode.title} cover`}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/episodes/${episode.id}`} className="hover:underline">
                      {episode.title}
                    </Link>
                    {episode.cover_image && (
                      <div className="mt-1">
                        <a 
                          href={episode.cover_image} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View full image
                        </a>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/podcasts/${episode.podcast_id}`} className="hover:underline">
                      {episode.podcast_title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatDuration(episode.duration)}
                  </TableCell>
                  <TableCell>
                    {renderStatus(episode.status)}
                  </TableCell>
                  <TableCell>
                    <EpisodeDateBadge
                      publishedAt={episode.published_at}
                      createdAt={episode.created_at}
                      variant="compact"
                      showRelativeTime={true}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <EpisodeActionsMenu episode={episode} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
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