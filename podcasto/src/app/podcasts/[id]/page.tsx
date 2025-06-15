import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { getPodcastById, getPublishedPodcastEpisodes } from '@/lib/db/api/podcasts';
import { formatDuration } from '@/lib/utils';
import { SubscribeButtonServer } from './subscribe-button-server';
import { PodcastImage } from '@/components/podcasts/podcast-image';
import { CompactAudioPlayer } from '@/components/podcasts/compact-audio-player';
import { Clock, Share2 } from 'lucide-react';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { sortEpisodesByDate } from '@/lib/utils/episode-utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const podcast = await getPodcastById(resolvedParams.id);
  
  if (!podcast) {
    return {
      title: 'Podcast Not Found | Podcasto',
      description: 'The requested podcast was not found',
    };
  }
  
  return {
    title: `${podcast.title} | Podcasto`,
    description: podcast.description,
  };
}

export default async function PodcastDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const podcast = await getPodcastById(resolvedParams.id);
  
  if (!podcast) {
    notFound();
  }
  
  const episodesData = await getPublishedPodcastEpisodes(resolvedParams.id);
  const episodes = sortEpisodesByDate(episodesData);
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:flex md:flex-col md:h-[calc(100vh-4rem)]">
        <div className="flex flex-col md:flex-row gap-8 md:h-full md:overflow-hidden">
          {/* Podcast Info */}
          <div className="md:w-1/3 md:overflow-y-auto md:pr-4">
            <div className="bg-gray-200 h-64 w-full rounded-lg relative mb-4 overflow-hidden">
              <PodcastImage
                imageUrl={podcast.cover_image}
                title={podcast.title}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold mb-2">{podcast.title}</h1>
            <p className="text-gray-600 mb-6">{podcast.episodes_count} episodes</p>
            <p className="text-gray-700 mb-6">{podcast.description}</p>
            
            <SubscribeButtonServer podcastId={resolvedParams.id} />
          </div>

          {/* Episodes List */}
          <div className="md:w-2/3 md:flex md:flex-col md:overflow-hidden">
            <h2 className="text-xl font-bold mb-6">Episodes ({episodes.length})</h2>
            
            {episodes.length > 0 ? (
              <div className="space-y-6 md:overflow-y-auto md:pr-1">
                {episodes.map((episode) => (
                  <Card key={episode.id} className="overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                        {episode.cover_image && (
                          <div className="w-full sm:w-28 h-36 sm:h-28 bg-gray-200 relative rounded-md overflow-hidden mb-3 sm:mb-0 sm:flex-shrink-0">
                          <PodcastImage
                            imageUrl={episode.cover_image}
                            title={episode.title}
                            className="object-cover"
                          />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <Link href={`/podcasts/${resolvedParams.id}/episodes/${episode.id}`} className="hover:underline flex-1">
                              <CardTitle className="text-base font-semibold line-clamp-2">{episode.title}</CardTitle>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-3 flex-shrink-0" title="Share episode">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mb-3">
                            <EpisodeDateBadge
                              publishedAt={episode.published_at}
                              createdAt={episode.created_at}
                              variant="default"
                              showRelativeTime={true}
                            />
                          </div>
                          {episode.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-2 mb-3">
                              {episode.description}
                            </p>
                          )}
                          <div className="flex items-center mb-4">
                            {episode.duration && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDuration(episode.duration)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-3">
                            <div className="w-full sm:w-auto sm:flex-1 max-w-full sm:max-w-xs mb-3 sm:mb-0">
                              <CompactAudioPlayer 
                                episodeId={episode.id}
                                title={episode.title}
                              />
                            </div>

                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0"
                              asChild
                            >
                              <Link href={`/podcasts/${resolvedParams.id}/episodes/${episode.id}`}>
                                View Episode
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-xl text-gray-500">No episodes available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 