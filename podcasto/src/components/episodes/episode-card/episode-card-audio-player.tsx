import { CompactAudioPlayer } from '@/components/podcasts/compact-audio-player';
import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.AudioPlayer - Displays compact audio player for episode
 */
export function EpisodeCardAudioPlayer() {
  const { episode } = useEpisodeCard();

  return (
    <div className="w-full sm:w-auto sm:flex-1 max-w-full sm:max-w-xs mb-3 sm:mb-0">
      <CompactAudioPlayer
        episodeId={episode.id}
        title={episode.title}
      />
    </div>
  );
}
