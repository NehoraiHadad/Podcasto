/**
 * Audio Player Progress Component
 * Displays visualizer and time information
 */

'use client';

import { formatDuration } from '@/lib/utils';
import { AudioVisualizer, VisualizerVariant } from '../../audio-visualizer';

interface AudioPlayerProgressProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  visualizerVariant: VisualizerVariant;
}

export function AudioPlayerProgress({
  audioRef,
  isPlaying,
  currentTime,
  duration,
  visualizerVariant,
}: AudioPlayerProgressProps) {
  return (
    <div className="mb-4">
      <AudioVisualizer
        audioRef={audioRef}
        isPlaying={isPlaying}
        height={80}
        waveColor="#9ca3af"
        progressColor="#3b82f6"
        variant={visualizerVariant}
      />
      <div className="flex justify-between text-sm text-gray-500 mt-1">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}
