/**
 * Audio Player Client Component
 * Full-featured audio player with all controls
 */

'use client';

import { useAudioPlayer, useAudioControls, useAudioPersistence } from './audio-player/hooks';
import {
  AudioPlayerControls,
  AudioLoadingState,
  AudioErrorState,
  AudioPlayerProgress,
} from './audio-player/components';
import { useAudioUrl } from '@/lib/hooks/use-audio-url';

interface AudioPlayerClientProps {
  episodeId: string;
  audioUrl?: string; // Made optional - will fetch if not provided
  _title: string;
  audioUrlError?: string;
}

export function AudioPlayerClient({
  episodeId,
  audioUrl: propAudioUrl,
  _title,
  audioUrlError: propAudioUrlError,
}: AudioPlayerClientProps) {
  // Use the new cached audio URL hook if URL not provided via props
  const {
    audioUrl: fetchedAudioUrl,
    isLoading: isFetchingUrl,
    error: fetchError
  } = useAudioUrl(episodeId);

  // Prefer prop URL (from server) over fetched URL for backwards compatibility
  // But fall back to cached fetch if prop URL not provided
  const audioUrl = propAudioUrl || fetchedAudioUrl;
  const audioUrlError = propAudioUrlError || (fetchError || undefined);

  // Use shared hooks
  const playerReturn = useAudioPlayer({
    episodeId,
    audioUrl: audioUrl || null,
    audioUrlError
  });
  const { visualizerVariant, setVisualizerVariant } = useAudioPersistence(episodeId);
  const handlers = useAudioControls(playerReturn);

  const { state, audioRef } = playerReturn;

  // Show loading state if fetching URL and no prop URL provided
  if (!propAudioUrl && isFetchingUrl) {
    return <AudioLoadingState />;
  }

  // Render error state
  if (state.error) {
    return <AudioErrorState error={state.error} audioUrl={audioUrl ?? undefined} />;
  }

  // Render loading state
  if (state.isLoading) {
    return <AudioLoadingState />;
  }

  // Render player
  return (
    <div className="w-full rounded-lg border border-gray-200 p-4">
      <AudioPlayerProgress
        audioRef={audioRef}
        isPlaying={state.isPlaying}
        currentTime={state.currentTime}
        duration={state.duration}
        visualizerVariant={visualizerVariant}
      />
      <AudioPlayerControls
        handlers={handlers}
        state={state}
        visualizerVariant={visualizerVariant}
        onVisualizerChange={setVisualizerVariant}
      />
    </div>
  );
}
