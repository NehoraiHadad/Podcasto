/**
 * Audio Controls Hook
 * Provides control functions for audio playback
 */

'use client';

import { useCallback } from 'react';
import type { AudioControlHandlers, AudioPlayerState } from '../types';

/**
 * Hook for audio control functions
 * @param playerReturn - Return value from useAudioPlayer hook
 * @returns Audio control handler functions
 */
export function useAudioControls(
  playerReturn: {
    state: AudioPlayerState;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    setIsPlaying: (value: boolean) => void;
    setVolume: (value: number) => void;
    setIsMuted: (value: boolean) => void;
    setPlaybackRate: (value: number) => void;
    setCurrentTime: (value: number) => void;
    setError: (value: string | null) => void;
  }
): AudioControlHandlers {
  const { state, audioRef } = playerReturn;
  const { isPlaying, duration, isMuted } = state;
  const {
    setIsPlaying,
    setVolume,
    setIsMuted,
    setPlaybackRate,
    setCurrentTime,
    setError,
  } = playerReturn;

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setError('Could not play audio. Please try again later.');
      });
    }

    setIsPlaying(!isPlaying);
  }, [audioRef, isPlaying, setIsPlaying, setError]);

  /**
   * Skip forward or backward by specified seconds
   */
  const skip = useCallback(
    (seconds: number) => {
      if (!audioRef.current) return;
      const newTime = Math.min(
        Math.max(0, audioRef.current.currentTime + seconds),
        duration
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [audioRef, duration, setCurrentTime]
  );

  /**
   * Handle volume slider change
   */
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      if (!audioRef.current) return;
      const newVolume = value[0];
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    },
    [audioRef, setVolume, setIsMuted]
  );

  /**
   * Toggle mute/unmute
   */
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    setIsMuted(!isMuted);
  }, [audioRef, isMuted, setIsMuted]);

  /**
   * Change playback speed
   */
  const changePlaybackRate = useCallback(
    (rate: number) => {
      if (!audioRef.current) return;
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    },
    [audioRef, setPlaybackRate]
  );

  return {
    togglePlayPause,
    skip,
    handleVolumeChange,
    toggleMute,
    changePlaybackRate,
  };
}
