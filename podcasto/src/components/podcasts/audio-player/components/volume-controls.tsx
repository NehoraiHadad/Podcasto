/**
 * Volume Controls Component
 * Volume slider and mute button for audio player
 */

'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeControlsProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
}

export function VolumeControls({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onToggleMute}>
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>

      <div className="w-24 hidden sm:block">
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[isMuted ? 0 : volume]}
          onValueChange={onVolumeChange}
        />
      </div>
    </div>
  );
}
