/**
 * Podcast Format Determiner
 * Determines the podcast format based on speaker selection strategy
 */

import type {
  PodcastFormat,
  PodcastConfigForFormat,
  SequenceState,
  FormatDeterminationResult
} from './types';

/**
 * Default values for podcast format configuration
 */
const DEFAULTS = {
  FORMAT: 'multi-speaker' as PodcastFormat,
  STRATEGY: 'fixed' as const,
  DUAL_COUNT: 1,
  SINGLE_COUNT: 1,
  PROGRESS: 0,
} as const;

/**
 * Determines format for fixed strategy
 * Returns the configured format without changes
 */
function determineFixedFormat(config: PodcastConfigForFormat): FormatDeterminationResult {
  return {
    podcast_format: config.podcast_format || DEFAULTS.FORMAT,
  };
}

/**
 * Determines format for random strategy
 * Randomly selects between single-speaker and multi-speaker
 */
function determineRandomFormat(): FormatDeterminationResult {
  const formats: PodcastFormat[] = ['single-speaker', 'multi-speaker'];
  const randomIndex = Math.floor(Math.random() * formats.length);

  return {
    podcast_format: formats[randomIndex],
  };
}

/**
 * Extracts and validates sequence state from config
 */
function extractSequenceState(config: PodcastConfigForFormat): SequenceState {
  return {
    current_type: config.sequence_current_speaker_type || DEFAULTS.FORMAT,
    progress_count: config.sequence_progress_count ?? DEFAULTS.PROGRESS,
    dual_count: config.sequence_dual_count ?? DEFAULTS.DUAL_COUNT,
    single_count: config.sequence_single_count ?? DEFAULTS.SINGLE_COUNT,
  };
}

/**
 * Calculates next state in sequence
 */
function calculateNextSequenceState(state: SequenceState): {
  next_type: PodcastFormat;
  next_progress: number;
} {
  // Increment progress for current episode
  const newProgress = state.progress_count + 1;

  // Check if we need to switch to the next type
  if (state.current_type === 'multi-speaker' && newProgress >= state.dual_count) {
    // Switch to single-speaker and reset progress
    return {
      next_type: 'single-speaker',
      next_progress: 0,
    };
  }

  if (state.current_type === 'single-speaker' && newProgress >= state.single_count) {
    // Switch to multi-speaker and reset progress
    return {
      next_type: 'multi-speaker',
      next_progress: 0,
    };
  }

  // Continue with current type
  return {
    next_type: state.current_type,
    next_progress: newProgress,
  };
}

/**
 * Determines format for sequence strategy
 * Returns current format and calculates next state for DB update
 */
function determineSequenceFormat(config: PodcastConfigForFormat): FormatDeterminationResult {
  const state = extractSequenceState(config);

  // Current episode uses the current type
  const podcast_format = state.current_type;

  // Calculate next state for after this episode
  const nextState = calculateNextSequenceState(state);

  return {
    podcast_format,
    sequence_state: nextState,
  };
}

/**
 * Main function: Determines podcast format based on speaker selection strategy
 *
 * @param config - Podcast configuration containing strategy and format settings
 * @returns Format determination result with podcast_format and optional sequence_state
 *
 * @example
 * // Fixed strategy
 * const result = determinePodcastFormat({
 *   speaker_selection_strategy: 'fixed',
 *   podcast_format: 'multi-speaker'
 * });
 * // Returns: { podcast_format: 'multi-speaker' }
 *
 * @example
 * // Random strategy
 * const result = determinePodcastFormat({
 *   speaker_selection_strategy: 'random'
 * });
 * // Returns: { podcast_format: 'single-speaker' | 'multi-speaker' } (random)
 *
 * @example
 * // Sequence strategy
 * const result = determinePodcastFormat({
 *   speaker_selection_strategy: 'sequence',
 *   sequence_dual_count: 2,
 *   sequence_single_count: 1,
 *   sequence_current_speaker_type: 'multi-speaker',
 *   sequence_progress_count: 1
 * });
 * // Returns: {
 * //   podcast_format: 'multi-speaker',
 * //   sequence_state: { next_type: 'single-speaker', next_progress: 0 }
 * // }
 */
export function determinePodcastFormat(
  config: PodcastConfigForFormat
): FormatDeterminationResult {
  const strategy = config.speaker_selection_strategy || DEFAULTS.STRATEGY;

  switch (strategy) {
    case 'fixed':
      return determineFixedFormat(config);

    case 'random':
      return determineRandomFormat();

    case 'sequence':
      return determineSequenceFormat(config);

    default:
      console.warn(`[FORMAT_DETERMINER] Unknown strategy: ${strategy}, defaulting to fixed`);
      return determineFixedFormat(config);
  }
}
