import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PodcastImage } from '@/components/podcasts/podcast-image';
import { AudioPlayerClient } from '@/components/podcasts/audio-player-client';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { ContentDateRangeBadge } from '@/components/episodes/content-date-range-badge';
import { EpisodeDownloadButton } from '@/components/episodes/episode-download-button';
import { EpisodeShareButton } from '@/components/episodes/episode-share-button';
import { formatDuration } from '@/lib/utils';
import { Podcast } from '@/lib/db/api/podcasts';
import { Episode } from '@/lib/db/api/episodes';

interface EpisodeDetailsPresenterProps {
  podcast: Podcast;
  episode: Episode;
  playableAudioUrl: string;
  audioUrlError?: string;
}

/**
 * Presenter component for Episode Details Page
 * Receives episode and podcast data as props and renders UI
 * Pure Server Component - no data fetching or business logic
 */
export function EpisodeDetailsPresenter({
  podcast,
  episode,
  playableAudioUrl,
  audioUrlError
}: EpisodeDetailsPresenterProps) {
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
                  <div className="mb-3">
                    <EpisodeDateBadge
                      publishedAt={episode.published_at}
                      createdAt={episode.created_at}
                      variant="detailed"
                      showRelativeTime={true}
                    />
                  </div>
                  <div className="mb-3">
                    <ContentDateRangeBadge
                      startDate={episode.content_start_date ? episode.content_start_date.toISOString() : null}
                      endDate={episode.content_end_date ? episode.content_end_date.toISOString() : null}
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
              <div className="space-y-4">
                <AudioPlayerClient
                  episodeId={episode.id}
                  audioUrl={playableAudioUrl}
                  audioUrlError={audioUrlError}
                  _title={episode.title}
                />
                {playableAudioUrl && (
                  <div className="flex gap-2 justify-center">
                    <EpisodeDownloadButton
                      episodeId={episode.id}
                      episodeTitle={episode.title}
                      audioUrl={playableAudioUrl}
                      audioFormat={episode.audio_format || 'mp3'}
                      variant="default"
                    />
                    <EpisodeShareButton
                      episodeId={episode.id}
                      episodeTitle={episode.title}
                      podcastId={podcast.id}
                      variant="outline"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
