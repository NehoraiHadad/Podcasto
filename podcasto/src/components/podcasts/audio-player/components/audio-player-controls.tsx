/**
 * Audio Player Controls Component
 * Full control bar with playback, volume, visualizer toggle, and speed controls
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, BarChart3, Waves } from 'lucide-react';
import { PlaybackControls } from './playback-controls';
import { VolumeControls } from './volume-controls';
import { PLAYBACK_SPEEDS, SKIP_BACKWARD_SECONDS, SKIP_FORWARD_SECONDS } from '../constants';
import type { AudioControlHandlers, AudioPlayerState } from '../types';
import type { VisualizerVariant } from '../../audio-visualizer';

interface AudioPlayerControlsProps {
  handlers: AudioControlHandlers;
  state: AudioPlayerState;
  visualizerVariant: VisualizerVariant;
  onVisualizerChange: (variant: VisualizerVariant) => void;
}

export function AudioPlayerControls({
  handlers,
  state,
  visualizerVariant,
  onVisualizerChange,
}: AudioPlayerControlsProps) {
  const { togglePlayPause, skip, handleVolumeChange, toggleMute, changePlaybackRate } = handlers;
  const { isPlaying, volume, isMuted, playbackRate } = state;

  return (
    <div className="flex items-center justify-between">
      <PlaybackControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlayPause}
        onSkipBackward={() => skip(-SKIP_BACKWARD_SECONDS)}
        onSkipForward={() => skip(SKIP_FORWARD_SECONDS)}
      />

      <div className="flex items-center gap-2">
        <VolumeControls
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
        />

        {/* Visualizer style toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            onVisualizerChange(visualizerVariant === 'bars' ? 'wave' : 'bars')
          }
          title={`Switch to ${visualizerVariant === 'bars' ? 'wave' : 'bars'} style`}
        >
          {visualizerVariant === 'bars' ? (
            <Waves className="h-5 w-5" />
          ) : (
            <BarChart3 className="h-5 w-5" />
          )}
        </Button>

        {/* Playback speed menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PLAYBACK_SPEEDS.map((speed) => (
              <DropdownMenuItem
                key={speed}
                onClick={() => changePlaybackRate(speed)}
                className={playbackRate === speed ? 'bg-accent' : ''}
              >
                {speed}x{speed === 1 ? ' (Normal)' : ''}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
