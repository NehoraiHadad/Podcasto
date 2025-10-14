/**
 * Audio Player Types
 * Shared TypeScript types and interfaces for audio player components
 */

import { VisualizerVariant } from '../audio-visualizer';

/**
 * Complete state of an audio player
 */
export interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Audio control handler functions
 */
export interface AudioControlHandlers {
  togglePlayPause: () => void;
  skip: (seconds: number) => void;
  handleVolumeChange: (value: number[]) => void;
  toggleMute: () => void;
  changePlaybackRate: (rate: number) => void;
}

/**
 * Options for initializing the audio player hook
 */
export interface UseAudioPlayerOptions {
  episodeId: string;
  audioUrl?: string | null;
  audioUrlError?: string;
  autoLoadUrl?: boolean;
}

/**
 * Return type for the main audio player hook
 */
export interface UseAudioPlayerReturn {
  state: AudioPlayerState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isReady: boolean;
  // State setters for controls
  setIsPlaying: (value: boolean) => void;
  setVolume: (value: number) => void;
  setIsMuted: (value: boolean) => void;
  setPlaybackRate: (value: number) => void;
  setCurrentTime: (value: number) => void;
  setError: (value: string | null) => void;
}

/**
 * Audio persistence data
 */
export interface AudioPersistenceData {
  visualizerVariant: VisualizerVariant;
  setVisualizerVariant: (variant: VisualizerVariant) => void;
}
