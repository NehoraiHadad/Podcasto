import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPodcastById } from '@/lib/db/api/podcasts';
import { getEpisodeById } from '@/lib/db/api/episodes';
import { getEpisodeAudioUrl } from '@/lib/actions/episode/audio-actions';
import { EpisodeDetailsPresenter } from '@/components/pages/episode-details-presenter';

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

  if (episode.status !== 'published') {
    notFound();
  }

  const { url: playableAudioUrl, error: audioUrlError } = await getEpisodeAudioUrl(episode.id);

  return (
    <EpisodeDetailsPresenter
      podcast={podcast}
      episode={episode}
      playableAudioUrl={playableAudioUrl}
      audioUrlError={audioUrlError}
    />
  );
} 