/**
 * Compact Audio Player Component
 * Minimal audio player for inline/embedded use
 */

'use client';

import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, BarChart3, Waves } from 'lucide-react';
import { AudioVisualizer } from './audio-visualizer';
import { useAudioPlayer, useAudioControls, useAudioPersistence } from './audio-player/hooks';
import { useAudioUrl } from '@/lib/hooks/use-audio-url';

interface CompactAudioPlayerProps {
  episodeId: string;
  title: string;
}

export function CompactAudioPlayer({ episodeId, title: _title }: CompactAudioPlayerProps) {
  // Use the new cached audio URL hook
  const { audioUrl, isLoading: isFetchingUrl, error: urlError } = useAudioUrl(episodeId);

  // Use shared hooks (same as full player!)
  const playerReturn = useAudioPlayer({
    episodeId,
    audioUrl,
    audioUrlError: urlError || undefined,
    autoLoadUrl: true,
  });
  const { visualizerVariant, setVisualizerVariant } = useAudioPersistence(episodeId);
  const { togglePlayPause, toggleMute } = useAudioControls(playerReturn);

  const { state, audioRef } = playerReturn;

  // Show error in compact format
  if (state.error || urlError) {
    return (
      <div className="text-xs text-red-600">
        Error: {state.error || urlError}
      </div>
    );
  }

  const isLoading = isFetchingUrl || state.isLoading;

  // Compact UI
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-shrink-0">
        <Button
          variant="default"
          size="sm"
          className="h-8 w-8 sm:h-7 sm:w-7 rounded-full p-0 touch-manipulation"
          onClick={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : state.isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <AudioVisualizer
          audioRef={audioRef}
          isPlaying={state.isPlaying}
          height={40}
          waveColor="#9ca3af"
          progressColor="#3b82f6"
          variant={visualizerVariant}
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>{formatDuration(state.currentTime)}</span>
          <span>{state.duration > 0 ? formatDuration(state.duration) : '--:--'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 sm:h-5 sm:w-5 p-0 touch-manipulation"
          onClick={() => setVisualizerVariant(visualizerVariant === 'bars' ? 'wave' : 'bars')}
          disabled={isLoading}
          title={`Switch to ${visualizerVariant === 'bars' ? 'wave' : 'bars'} style`}
        >
          {visualizerVariant === 'bars' ? (
            <Waves className="h-3 w-3" />
          ) : (
            <BarChart3 className="h-3 w-3" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 sm:h-5 sm:w-5 p-0 touch-manipulation"
          onClick={toggleMute}
          disabled={isLoading}
        >
          {state.isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
