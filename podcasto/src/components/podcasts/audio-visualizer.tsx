'use client';

import { useRef, useEffect, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';

export type VisualizerVariant = 'bars' | 'wave';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  variant?: VisualizerVariant;
}

export function AudioVisualizer({
  audioRef,
  isPlaying,
  height = 64,
  waveColor = '#9ca3af',
  progressColor = '#3b82f6',
  variant = 'bars'
}: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure style based on variant
  const styleConfig = variant === 'wave'
    ? {
        barWidth: 0,      // Solid wave
        barGap: 0,
        barRadius: 0,
      }
    : {
        barWidth: 2,      // Bars style
        barGap: 1,
        barRadius: 2,
      };

  const { wavesurfer, isReady } = useWavesurfer({
    container: containerRef,
    waveColor,
    progressColor,
    height,
    ...styleConfig,
    normalize: true,
    interact: true,
    cursorWidth: 1,
    cursorColor: progressColor,
    media: audioRef.current || undefined,
  });

  // Track when wavesurfer is ready
  useEffect(() => {
    if (isReady) {
      setIsLoading(false);
    }
  }, [isReady]);

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
    <div className="relative w-full rounded-md overflow-hidden" style={{ height: `${height}px` }}>
      {/* Waveform container */}
      <div
        ref={containerRef}
        className="w-full h-full transition-opacity duration-300"
        style={{
          opacity: isLoading ? 0 : 1,
          pointerEvents: isLoading ? 'none' : 'auto'
        }}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-end justify-center gap-1 px-2 bg-gray-50 dark:bg-gray-900"
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const randomHeight = Math.random() * 0.6 + 0.2; // 20%-80% של הגובה
            return (
              <div
                key={i}
                className="w-0.5 bg-blue-400/60 dark:bg-blue-500/60 rounded-full animate-pulse"
                style={{
                  height: `${randomHeight * height}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
