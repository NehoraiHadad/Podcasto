/**
 * Audio Player Hook
 * Main hook for managing audio player state and audio element lifecycle
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { DEFAULT_VOLUME } from '../constants';
import { loadPlaybackPosition, savePlaybackPosition, saveVolume } from './use-audio-persistence';
import type { AudioPlayerState, UseAudioPlayerOptions, UseAudioPlayerReturn } from '../types';

/**
 * Main audio player hook - handles all audio state and lifecycle
 * @param options - Configuration options for the audio player
 * @returns Audio player state, audio ref, and ready status
 */
export function useAudioPlayer({
  episodeId,
  audioUrl,
  audioUrlError,
  autoLoadUrl = false,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(audioUrlError || null);

  // Reference to audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    // Don't initialize if we have an error or no URL (and not auto-loading)
    if (audioUrlError || (!audioUrl && !autoLoadUrl)) {
      setIsLoading(false);
      setError(audioUrlError || null);
      return;
    }

    // Wait for URL if auto-loading
    if (!audioUrl && autoLoadUrl) {
      return;
    }

    if (!audioUrl) {
      setIsLoading(false);
      setError('No audio URL provided');
      return;
    }

    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Event handlers
    const handleMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      let errorMessage = 'Failed to load audio. Please try again later.';

      if (audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'The audio loading was aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'A network error occurred while loading the audio.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'The audio could not be decoded. The file might be corrupted.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'The audio format is not supported or the URL is invalid.';
            break;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    // Initialize volume
    audio.volume = volume;

    // Load saved position
    const savedPosition = loadPlaybackPosition(episodeId);
    if (savedPosition) {
      audio.currentTime = savedPosition;
      setCurrentTime(savedPosition);
    }

    // Clean up
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, audioUrlError, episodeId, volume, autoLoadUrl]);

  // Save position and volume on unload and when they change
  useEffect(() => {
    // Update audio element volume
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }

    // Save position on unload
    const saveState = () => {
      if (audioRef.current && currentTime > 0) {
        savePlaybackPosition(episodeId, currentTime);
        saveVolume(episodeId, volume);
      }
    };

    window.addEventListener('beforeunload', saveState);

    return () => {
      saveState();
      window.removeEventListener('beforeunload', saveState);
    };
  }, [currentTime, episodeId, volume, isMuted]);

  // Build state object
  const state: AudioPlayerState = {
    isPlaying,
    duration,
    currentTime,
    volume,
    isMuted,
    playbackRate,
    isLoading,
    error,
  };

  // Expose state setters for control hook
  const isReady = !isLoading && !error && audioRef.current !== null;

  return {
    state,
    audioRef,
    isReady,
    // State setters for controls
    setIsPlaying,
    setVolume,
    setIsMuted,
    setPlaybackRate,
    setCurrentTime,
    setError,
  };
}
