import { requireAdmin } from '@/lib/actions/auth-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Suspense } from 'react';
import { episodesApi, podcastsApi } from '@/lib/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EpisodeActionsMenu } from '@/components/admin/episode-actions-menu';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';

export const metadata = {
  title: 'Episode Details | Admin Dashboard | Podcasto',
  description: 'View podcast episode details',
};

// Loading skeleton for the episode details
function EpisodeDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

interface EpisodePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function EpisodeDetails({ params }: EpisodePageProps) {
  // Await params before using its properties
  const resolvedParams = await params;
  
  // Fetch episode data
  const episode = await episodesApi.getEpisodeById(resolvedParams.id);
  
  if (!episode) {
    notFound();
  }
  
  // Fetch podcast data if podcast_id exists
  let podcast = null;
  if (episode.podcast_id) {
    podcast = await podcastsApi.getPodcastById(episode.podcast_id);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{episode.title}</h1>
          {podcast && (
            <Link href={`/admin/podcasts/${podcast.id}`} className="text-muted-foreground hover:underline">
              {podcast.title}
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/admin/episodes/${episode.id}/edit`}>
            <Button>Edit Episode</Button>
          </Link>
          <EpisodeActionsMenu episode={{
            id: episode.id,
            podcast_id: episode.podcast_id || '',
            title: episode.title,
            audio_url: episode.audio_url,
            cover_image: episode.cover_image,
            status: episode.status
          }} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Episode Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div>{renderStatus(episode.status)}</div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p>{episode.description || 'No description'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Language</p>
              <p>{episode.language || 'Not specified'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p>{formatDuration(episode.duration)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Episode Date</p>
              <EpisodeDateBadge
                publishedAt={episode.published_at}
                createdAt={episode.created_at}
                variant="detailed"
                showRelativeTime={true}
              />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{episode.created_at ? format(episode.created_at, 'PPP p') : 'Unknown'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Published</p>
              <p>{episode.published_at ? format(episode.published_at, 'PPP p') : 'Not published'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Audio URL</p>
              <a 
                href={episode.audio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {episode.audio_url}
              </a>
            </div>
          </CardContent>
        </Card>
        
        {/* Right column - Media */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {episode.cover_image ? (
                <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-md">
                  <Image
                    src={episode.cover_image}
                    alt={`${episode.title} cover`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 right-2">
                    <a
                      href={episode.cover_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black/50 text-white px-2 py-1 rounded text-xs"
                    >
                      View Original
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[320px] aspect-square bg-gray-100 flex items-center justify-center rounded-md">
                  <p className="text-muted-foreground">No cover image</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Audio Player</CardTitle>
            </CardHeader>
            <CardContent>
              <audio
                src={episode.audio_url}
                controls
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  // Ensure user is an admin
  await requireAdmin();
  
  return (
    <Suspense fallback={<EpisodeDetailsSkeleton />}>
      <EpisodeDetails params={params} />
    </Suspense>
  );
} 