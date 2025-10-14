import { usePodcastCard } from './podcast-card';

/**
 * PodcastCard.Title - Displays podcast title
 */
export function PodcastCardTitle() {
  const { podcast } = usePodcastCard();

  return (
    <div className="leading-none font-semibold text-foreground">
      {podcast.title}
    </div>
  );
}
