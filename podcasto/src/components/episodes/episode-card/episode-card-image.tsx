import { PodcastImage } from '@/components/podcasts/podcast-image';
import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.Image - Displays optional episode cover image
 */
export function EpisodeCardImage() {
  const { episode } = useEpisodeCard();

  if (!episode.cover_image) {
    return null;
  }

  return (
    <div className="w-full sm:w-28 h-36 sm:h-28 bg-gray-200 relative rounded-md overflow-hidden mb-3 sm:mb-0 sm:flex-shrink-0">
      <PodcastImage
        imageUrl={episode.cover_image}
        title={episode.title}
        className="object-cover"
      />
    </div>
  );
}
