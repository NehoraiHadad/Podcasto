import { PodcastImage } from '@/components/podcasts/podcast-image';
import { usePodcastCard } from './podcast-card';

/**
 * PodcastCard.Image - Displays podcast cover image
 */
export function PodcastCardImage() {
  const { podcast } = usePodcastCard();

  return (
    <div className="h-48 bg-muted relative">
      <PodcastImage
        imageUrl={podcast.cover_image}
        title={podcast.title}
      />
    </div>
  );
}
