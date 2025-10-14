import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.ViewButton - Link to full episode page
 */
export function EpisodeCardViewButton() {
  const { episode, podcastId } = useEpisodeCard();

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0"
      asChild
    >
      <Link href={`/podcasts/${podcastId}/episodes/${episode.id}`}>
        View Episode
      </Link>
    </Button>
  );
}
