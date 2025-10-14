import { usePodcastCard } from './podcast-card';

/**
 * PodcastCard.EpisodeCount - Displays episode count
 */
export function PodcastCardEpisodeCount() {
  const { podcast } = usePodcastCard();

  return (
    <div className="text-muted-foreground text-sm">
      {podcast.episodes_count} episodes
    </div>
  );
}
