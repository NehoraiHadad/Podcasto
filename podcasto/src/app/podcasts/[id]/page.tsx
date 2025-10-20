import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPodcastById, getPublishedPodcastEpisodes } from '@/lib/db/api/podcasts';
import { getPodcastGroupByPodcastId, getPodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups';
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

  // Check if podcast belongs to a group (for language switching)
  let podcastGroup = null;
  if (podcast.podcast_group_id) {
    const basicGroup = await getPodcastGroupByPodcastId(resolvedParams.id);
    if (basicGroup) {
      podcastGroup = await getPodcastGroupWithLanguages(basicGroup.id);
    }
  }

  const episodesData = await getPublishedPodcastEpisodes(resolvedParams.id);
  const episodes = sortEpisodesByDate(episodesData);

  return (
    <PodcastDetailsPresenter
      podcast={podcast}
      episodes={episodes}
      podcastId={resolvedParams.id}
      podcastGroup={podcastGroup}
    />
  );
} 