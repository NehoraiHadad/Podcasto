import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePodcastCard } from './podcast-card';

/**
 * PodcastCard.ListenButton - Link to podcast details page
 */
export function PodcastCardListenButton() {
  const { podcast } = usePodcastCard();

  return (
    <Link href={`/podcasts/${podcast.id}`} className="w-full">
      <Button variant="outline" className="w-full">
        Listen Now
      </Button>
    </Link>
  );
}
