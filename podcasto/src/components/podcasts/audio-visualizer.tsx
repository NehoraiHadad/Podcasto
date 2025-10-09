'use client';

import { useRef, useEffect } from 'react';
import { useWavesurfer } from '@wavesurfer/react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  height?: number;
  waveColor?: string;
  progressColor?: string;
}

export function AudioVisualizer({
  audioRef,
  isPlaying,
  height = 64,
  waveColor = '#9ca3af',
  progressColor = '#3b82f6'
}: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    waveColor,
    progressColor,
    height,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    normalize: true,
    interact: true,
    cursorWidth: 1,
    cursorColor: progressColor,
    media: audioRef.current || undefined,
  });

  // Sync with external audio element
  useEffect(() => {
    if (!wavesurfer || !audioRef.current) return;

    // Load media element if not already loaded
    if (wavesurfer.getMediaElement() !== audioRef.current) {
      wavesurfer.setMediaElement(audioRef.current);
    }
  }, [wavesurfer, audioRef]);

  // Sync play/pause state
  useEffect(() => {
    if (!wavesurfer) return;

    if (isPlaying) {
      wavesurfer.play();
    } else {
      wavesurfer.pause();
    }
  }, [isPlaying, wavesurfer]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-md overflow-hidden"
      style={{ height: `${height}px` }}
    />
  );
}
