import { MainLayout } from '@/components/layout/main-layout';
import { PodcastImage } from '@/components/podcasts/podcast-image';
import { EpisodeCard } from '@/components/episodes/episode-card';
import { Podcast } from '@/lib/db/api/podcasts';
import { Episode } from '@/lib/db/api/episodes';
import { SubscribeButtonServer } from '@/app/podcasts/[id]/subscribe-button-server';
import { PodcastDetailsLanguageSwitcher } from './podcast-details-language-switcher';
import type { PodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups';

interface PodcastDetailsPresenterProps {
  podcast: Podcast;
  episodes: Episode[];
  podcastId: string;
  podcastGroup?: PodcastGroupWithLanguages | null;
}

/**
 * Presenter component for Podcast Details Page
 * Receives podcast and episodes data as props and renders UI
 * Pure Server Component - no data fetching or business logic
 */
export function PodcastDetailsPresenter({
  podcast,
  episodes,
  podcastId,
  podcastGroup
}: PodcastDetailsPresenterProps) {
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

            {/* Language Switcher - only shows if podcast has multiple languages */}
            {podcastGroup && (
              <PodcastDetailsLanguageSwitcher
                podcastGroup={podcastGroup}
                currentPodcastId={podcastId}
              />
            )}

            <h1 className="text-2xl font-bold mb-2">{podcast.title}</h1>
            <p className="text-gray-600 mb-6">{episodes.length} episodes</p>
            <p className="text-gray-700 mb-6">{podcast.description}</p>

            <SubscribeButtonServer podcastId={podcastId} />
          </div>

          {/* Episodes List */}
          <div className="md:w-2/3 md:flex md:flex-col md:overflow-hidden">
            <h2 className="text-xl font-bold mb-6">Episodes ({episodes.length})</h2>

            {episodes.length > 0 ? (
              <div className="space-y-6 md:overflow-y-auto md:pr-1">
                {episodes.map((episode) => (
                  <EpisodeCard key={episode.id} episode={episode} podcastId={podcastId} />
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
