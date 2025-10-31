import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPodcastById } from '@/lib/db/api/podcasts';
import { getEpisodeById } from '@/lib/db/api/episodes';
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

  // Use proxy URL to hide CloudFront/S3 URLs from client
  const playableAudioUrl = `/api/episodes/${episode.id}/audio`;
  const audioUrlError = episode.audio_url ? undefined : 'Episode has no audio file';

  return (
    <EpisodeDetailsPresenter
      podcast={podcast}
      episode={episode}
      playableAudioUrl={playableAudioUrl}
      audioUrlError={audioUrlError}
    />
  );
} 