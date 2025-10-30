/**
 * Podcast Format Service
 *
 * Determines podcast format based on speaker selection strategy:
 * - Fixed: Uses configured format
 * - Random: Randomly selects format for each episode
 * - Sequence: Alternates between formats in a configured pattern
 *
 * @example
 * ```typescript
 * import { determinePodcastFormat, updateSequenceStateIfNeeded } from '@/lib/services/podcast-format';
 *
 * // Determine format
 * const result = determinePodcastFormat(podcastConfig);
 *
 * // Update DB if sequence strategy
 * await updateSequenceStateIfNeeded(podcastId, result);
 *
 * // Use the determined format
 * const format = result.podcast_format;
 * ```
 */

export { determinePodcastFormat } from './determiner';
export { updateSequenceStateIfNeeded } from './db-updater';
export type {
  PodcastFormat,
  SpeakerSelectionStrategy,
  PodcastConfigForFormat,
  SequenceState,
  FormatDeterminationResult,
} from './types';
