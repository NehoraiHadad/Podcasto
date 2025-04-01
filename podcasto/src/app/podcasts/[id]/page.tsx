import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { getPodcastById, getPodcastEpisodes } from '@/lib/db/api/podcasts';
import { formatDuration } from '@/lib/utils';
import { SubscribeButtonServer } from './subscribe-button-server';
import { PodcastImage } from '@/components/podcasts/podcast-image';
import { CompactAudioPlayer } from '@/components/podcasts/compact-audio-player';
import { CalendarIcon, Clock, Share2 } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const podcast = await getPodcastById(resolvedParams.id);
  
  if (!podcast) {
    return {
      title: 'Podcast Not Found | podcasto',
      description: 'The requested podcast was not found',
    };
  }
  
  return {
    title: `${podcast.title} | podcasto`,
    description: podcast.description,
  };
}

export default async function PodcastDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const podcast = await getPodcastById(resolvedParams.id);
  
  if (!podcast) {
    notFound();
  }
  
  const episodes = await getPodcastEpisodes(resolvedParams.id);
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Podcast Info */}
          <div className="md:w-1/3">
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
          <div className="md:w-2/3">
            <h2 className="text-xl font-bold mb-6">Episodes ({episodes.length})</h2>
            
            {episodes.length > 0 ? (
              <div className="space-y-6">
                {episodes.map((episode) => (
                  <Card key={episode.id} className="overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {episode.cover_image && (
                          <div className="w-20 sm:w-28 h-20 sm:h-28 bg-gray-200 relative rounded-md overflow-hidden flex-shrink-0">
                          <PodcastImage
                            imageUrl={episode.cover_image}
                            title={episode.title}
                            className="object-cover"
                          />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={`/podcasts/${resolvedParams.id}/episodes/${episode.id}`} className="hover:underline">
                            <CardTitle className="text-base font-semibold line-clamp-2">{episode.title}</CardTitle>
                          </Link>
                          {episode.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1 mb-1">
                              {episode.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1 flex-wrap">
                            <div className="flex flex-wrap items-center text-xs text-gray-500 gap-3">
                              {episode.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(episode.duration)}</span>
                                </div>
                              )}
                              {episode.created_at && (
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{new Date(episode.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}</span>
                                </div>
                              )}
                            </div>
                            
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2">
                            <div className="w-full sm:w-auto sm:flex-1 max-w-full sm:max-w-xs">
                              <CompactAudioPlayer 
                                episodeId={episode.id}
                                title={episode.title}
                              />
                            </div>

                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0"
                              asChild
                            >
                              <Link href={`/podcasts/${resolvedParams.id}/episodes/${episode.id}`}>
                                View Episode
                              </Link>
                            </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Share episode">
                              <Share2 className="h-3.5 w-3.5" />
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