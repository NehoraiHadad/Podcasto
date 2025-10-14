import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPodcastById, getPublishedPodcastEpisodes } from '@/lib/db/api/podcasts';
import { sortEpisodesByDate } from '@/lib/utils/episode-utils';
import { PodcastDetailsPresenter } from '@/components/pages/podcast-details-presenter';

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
    <PodcastDetailsPresenter
      podcast={podcast}
      episodes={episodes}
      podcastId={resolvedParams.id}
    />
  );
} 