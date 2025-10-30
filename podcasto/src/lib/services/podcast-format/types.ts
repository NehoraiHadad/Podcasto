/**
 * Types for podcast format determination
 */

export type PodcastFormat = 'single-speaker' | 'multi-speaker';

export type SpeakerSelectionStrategy = 'fixed' | 'random' | 'sequence';

export interface PodcastConfigForFormat {
  podcast_format?: PodcastFormat;
  speaker_selection_strategy?: SpeakerSelectionStrategy;
  sequence_dual_count?: number | null;
  sequence_single_count?: number | null;
  sequence_current_speaker_type?: PodcastFormat;
  sequence_progress_count?: number;
}

export interface SequenceState {
  current_type: PodcastFormat;
  progress_count: number;
  dual_count: number;
  single_count: number;
}

export interface FormatDeterminationResult {
  podcast_format: PodcastFormat;
  sequence_state?: {
    next_type: PodcastFormat;
    next_progress: number;
  };
}
