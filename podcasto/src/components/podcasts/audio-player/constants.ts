/**
 * Audio Player Constants
 * Shared constants used across audio player components
 */

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const SKIP_BACKWARD_SECONDS = 10;
export const SKIP_FORWARD_SECONDS = 30;
export const DEFAULT_VOLUME = 1;

export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number];
