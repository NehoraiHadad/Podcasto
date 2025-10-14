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

interface AudioPlayerClientProps {
  episodeId: string;
  audioUrl: string;
  _title: string;
  audioUrlError?: string;
}

export function AudioPlayerClient({
  episodeId,
  audioUrl,
  _title,
  audioUrlError,
}: AudioPlayerClientProps) {
  // Use shared hooks
  const playerReturn = useAudioPlayer({ episodeId, audioUrl, audioUrlError });
  const { visualizerVariant, setVisualizerVariant } = useAudioPersistence(episodeId);
  const handlers = useAudioControls(playerReturn);

  const { state, audioRef } = playerReturn;

  // Render error state
  if (state.error) {
    return <AudioErrorState error={state.error} audioUrl={audioUrl} />;
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
