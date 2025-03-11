import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPodcastById, getPodcastEpisodes } from '@/lib/db/api/podcasts';
import { formatDuration } from '@/lib/utils';
import { SubscribeButtonServer } from './subscribe-button-server';
import { PodcastImage } from '@/components/podcasts/podcast-image';

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
              <div className="space-y-4">
                {episodes.map((episode) => (
                  <Card key={episode.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{episode.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {episode.duration ? formatDuration(episode.duration) : 'Unknown length'} | 
                          {episode.created_at ? new Date(episode.created_at).toLocaleDateString('en-US') : 'No date'}
                        </div>
                        <Link href={`/podcasts/${resolvedParams.id}/episodes/${episode.id}`}>
                          <Button variant="outline" size="sm">
                            Listen
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
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