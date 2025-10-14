import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.Description - Displays optional episode description
 */
export function EpisodeCardDescription() {
  const { episode } = useEpisodeCard();

  if (!episode.description) {
    return null;
  }

  return (
    <p className="text-sm text-gray-600 line-clamp-2 mt-2 mb-3">
      {episode.description}
    </p>
  );
}
