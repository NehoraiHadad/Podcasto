'use client';

import { useRef, useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);

  const { wavesurfer, isReady } = useWavesurfer({
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
        className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          style={{ height: `${height}px` }}
        >
          <div className="flex items-center gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
