/**
 * Playback Controls Component
 * Play/pause and skip buttons for audio player
 */

'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
}

export function PlaybackControls({
  isPlaying,
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onSkipBackward}
        title="Skip backward 10 seconds"
      >
        <SkipBack className="h-5 w-5" />
      </Button>

      <Button
        variant="default"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onSkipForward}
        title="Skip forward 30 seconds"
      >
        <SkipForward className="h-5 w-5" />
      </Button>
    </div>
  );
}
