import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPodcastById, getEpisodesByPodcastId } from '@/lib/api/podcasts';
import { formatDuration } from '@/lib/utils';
import { SubscribeButton } from './subscribe-button';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
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

export default async function PodcastDetailsPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const podcast = await getPodcastById(resolvedParams.id);
  
  if (!podcast) {
    notFound();
  }
  
  const episodes = await getEpisodesByPodcastId(resolvedParams.id);
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Podcast Info */}
          <div className="md:w-1/3">
            <div className="bg-gray-200 h-64 w-full rounded-lg relative mb-4 overflow-hidden">
              {podcast.image_url ? (
                <Image
                  src={podcast.image_url}
                  alt={podcast.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <svg
                    className="w-16 h-16"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{podcast.title}</h1>
            <p className="text-gray-600 mb-6">{podcast.episodes_count} episodes | {podcast.language}</p>
            <p className="text-gray-700 mb-6">{podcast.description}</p>
            
            <SubscribeButton podcastId={resolvedParams.id} />
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
                          {new Date(episode.created_at).toLocaleDateString('en-US')}
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