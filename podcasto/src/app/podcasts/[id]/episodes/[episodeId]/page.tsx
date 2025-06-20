import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPodcastById } from '@/lib/db/api/podcasts';
import { getEpisodeById } from '@/lib/db/api/episodes';
import { PodcastImage } from '@/components/podcasts/podcast-image';
import { AudioPlayerClient } from '@/components/podcasts/audio-player-client';
import { formatDuration } from '@/lib/utils';
import { getEpisodeAudioUrl } from '@/lib/actions/episode-actions';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string; episodeId: string }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const episode = await getEpisodeById(resolvedParams.episodeId);
  
  if (!episode) {
    return {
      title: 'Episode Not Found | Podcasto',
      description: 'The requested episode was not found',
    };
  }
  
  const podcast = await getPodcastById(resolvedParams.id);
  
  return {
    title: `${episode.title} | ${podcast?.title || 'Podcasto'}`,
    description: episode.description || '',
  };
}

export default async function EpisodeDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; episodeId: string }> 
}) {
  const resolvedParams = await params;
  const podcast = await getPodcastById(resolvedParams.id);
  const episode = await getEpisodeById(resolvedParams.episodeId);
  
  if (!episode || !podcast) {
    notFound();
  }

  // Check if episode is published (for regular users)
  if (episode.status !== 'published') {
    notFound();
  }
  
  // Get the playable audio URL from the server action
  const { url: playableAudioUrl, error: audioUrlError } = await getEpisodeAudioUrl(episode.id);
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 h-64 bg-gray-200 relative rounded-lg overflow-hidden">
                  <PodcastImage
                    imageUrl={episode.cover_image || podcast.cover_image}
                    title={episode.title}
                    priority
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">{podcast.title}</p>
                  <CardTitle className="text-2xl mb-3">{episode.title}</CardTitle>
                  <div className="mb-4">
                    <EpisodeDateBadge
                      publishedAt={episode.published_at}
                      createdAt={episode.created_at}
                      variant="detailed"
                      showRelativeTime={true}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    {episode.duration ? formatDuration(episode.duration) : 'Unknown length'}
                  </div>
                  {episode.description && (
                    <p className="text-gray-700">{episode.description}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AudioPlayerClient 
                episodeId={episode.id} 
                audioUrl={playableAudioUrl}
                audioUrlError={audioUrlError}
                _title={episode.title}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 