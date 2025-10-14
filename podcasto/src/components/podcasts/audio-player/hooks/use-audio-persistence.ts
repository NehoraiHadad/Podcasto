/**
 * Audio Persistence Hook
 * Manages localStorage persistence for audio player preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { VisualizerVariant } from '../../audio-visualizer';
import type { AudioPersistenceData } from '../types';

/**
 * Hook for managing audio player persistence in localStorage
 * @param _episodeId - Unique identifier for the episode (reserved for future use)
 * @returns Persistence data and setters
 */
export function useAudioPersistence(_episodeId: string): AudioPersistenceData {
  // Load visualizer preference from localStorage
  const [visualizerVariant, setVisualizerVariant] = useState<VisualizerVariant>(() => {
    if (typeof window === 'undefined') return 'bars';
    const saved = localStorage.getItem('visualizer_variant');
    return (saved as VisualizerVariant) || 'bars';
  });

  // Save visualizer variant preference whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('visualizer_variant', visualizerVariant);
  }, [visualizerVariant]);

  return {
    visualizerVariant,
    setVisualizerVariant,
  };
}

/**
 * Save current playback position to localStorage
 */
export function savePlaybackPosition(episodeId: string, currentTime: number): void {
  if (typeof window === 'undefined' || currentTime <= 0) return;
  localStorage.setItem(`podcast_position_${episodeId}`, currentTime.toString());
}

/**
 * Load saved playback position from localStorage
 */
export function loadPlaybackPosition(episodeId: string): number | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(`podcast_position_${episodeId}`);
  return saved ? parseFloat(saved) : null;
}

/**
 * Save volume preference to localStorage
 */
export function saveVolume(episodeId: string, volume: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`podcast_volume_${episodeId}`, volume.toString());
}

/**
 * Load saved volume from localStorage
 */
export function loadVolume(episodeId: string): number | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(`podcast_volume_${episodeId}`);
  return saved ? parseFloat(saved) : null;
}
