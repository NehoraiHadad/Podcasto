import { usePodcastCard } from './podcast-card';

/**
 * PodcastCard.Description - Displays podcast description
 */
export function PodcastCardDescription() {
  const { podcast } = usePodcastCard();

  return (
    <p className="text-foreground/80">
      {podcast.description}
    </p>
  );
}
