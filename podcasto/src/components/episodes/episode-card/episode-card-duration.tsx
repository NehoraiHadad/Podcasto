import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.Duration - Displays episode duration
 */
export function EpisodeCardDuration() {
  const { episode } = useEpisodeCard();

  if (!episode.duration) {
    return null;
  }

  return (
    <div className="flex items-center mb-4">
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>{formatDuration(episode.duration)}</span>
      </div>
    </div>
  );
}
