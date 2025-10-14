import Link from 'next/link';
import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.Title - Displays episode title with link to episode page
 */
export function EpisodeCardTitle() {
  const { episode, podcastId } = useEpisodeCard();

  return (
    <Link
      href={`/podcasts/${podcastId}/episodes/${episode.id}`}
      className="hover:underline flex-1"
    >
      <div className="text-base font-semibold line-clamp-2">
        {episode.title}
      </div>
    </Link>
  );
}
