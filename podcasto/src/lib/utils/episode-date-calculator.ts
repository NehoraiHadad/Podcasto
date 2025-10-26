/**
 * Episode Date Calculator Utility
 *
 * Calculates episode creation dates based on podcast frequency settings
 * All dates are handled in UTC - use createDateRangeUTC for timezone-aware queries
 */

import { getMaxBatchSize, getDelayBetweenRequests } from './rate-limit-config';
import { formatInTimezoneServer, daysBetween } from './date/server';

export interface EpisodeDateRange {
  startDate: Date;
  endDate: Date;
  episodeNumber: number;
}

export interface EpisodeBatch {
  batchNumber: number;
  episodes: EpisodeDateRange[];
  estimatedTimeSeconds: number;
}

export interface BatchConfiguration {
  batches: EpisodeBatch[];
  totalBatches: number;
  episodesPerBatch: number;
  requiresBatching: boolean;
  totalEstimatedTimeSeconds: number;
}

export interface CalculateEpisodeDatesParams {
  startDate: Date;
  endDate: Date;
  episodeFrequency: number; // in days
}

export interface CalculateEpisodeDatesResult {
  success: boolean;
  episodeDates?: EpisodeDateRange[];
  error?: string;
  totalEpisodes?: number;
}

/**
 * Absolute maximum number of episodes that can be requested in total
 * This is independent of batching - batching will split large requests
 */
const MAX_TOTAL_EPISODES = 100;

/**
 * Calculates date ranges for episodes based on frequency
 *
 * @param params - Configuration for episode date calculation
 * @returns Array of date ranges for each episode to be created
 *
 * @example
 * calculateEpisodeDates({
 *   startDate: new Date('2024-07-01'),
 *   endDate: new Date('2024-08-31'),
 *   episodeFrequency: 7 // weekly
 * })
 * // Returns: [
 * //   { startDate: 2024-07-01, endDate: 2024-07-08, episodeNumber: 1 },
 * //   { startDate: 2024-07-08, endDate: 2024-07-15, episodeNumber: 2 },
 * //   ...
 * // ]
 */
export function calculateEpisodeDates({
  startDate,
  endDate,
  episodeFrequency
}: CalculateEpisodeDatesParams): CalculateEpisodeDatesResult {
  // Validation
  if (!startDate || !endDate || !episodeFrequency) {
    return {
      success: false,
      error: 'Missing required parameters'
    };
  }

  if (startDate >= endDate) {
    return {
      success: false,
      error: 'Start date must be before end date'
    };
  }

  if (episodeFrequency < 1) {
    return {
      success: false,
      error: 'Episode frequency must be at least 1 day'
    };
  }

  const episodeDates: EpisodeDateRange[] = [];
  let currentStart = new Date(startDate);
  let episodeNumber = 1;

  // Calculate date ranges for each episode
  while (currentStart < endDate) {
    // Calculate the end date for this episode (start + frequency)
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + episodeFrequency);

    // If this would go past the overall end date, cap it
    const actualEnd = currentEnd > endDate ? new Date(endDate) : currentEnd;

    episodeDates.push({
      startDate: new Date(currentStart),
      endDate: actualEnd,
      episodeNumber
    });

    // Check if we've exceeded the absolute maximum
    if (episodeDates.length >= MAX_TOTAL_EPISODES) {
      return {
        success: false,
        error: `Maximum of ${MAX_TOTAL_EPISODES} episodes can be created in total. Please reduce the date range.`
      };
    }

    // Move to the next episode period
    currentStart = new Date(actualEnd);
    episodeNumber++;
  }

  // Ensure we created at least one episode
  if (episodeDates.length === 0) {
    return {
      success: false,
      error: 'No episodes would be created with the given date range and frequency'
    };
  }

  return {
    success: true,
    episodeDates,
    totalEpisodes: episodeDates.length
  };
}

/**
 * Format a date range for display
 * NOTE: This uses en-GB format. For timezone-aware formatting,
 * use formatDateRange from @/lib/utils/date/client
 */
export function formatDateRange(range: EpisodeDateRange): string {
  const formatDate = (date: Date) => {
    // Using formatInTimezoneServer for consistent UTC-based formatting
    return formatInTimezoneServer(date, 'UTC', 'dd/MM/yyyy');
  };

  return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
}

/**
 * Calculate estimated time for bulk episode generation
 * Uses dynamic delay based on configured Gemini API rate limit
 */
export function estimateGenerationTime(episodeCount: number): {
  seconds: number;
  formattedTime: string;
} {
  const delaySeconds = getDelayBetweenRequests() / 1000; // convert ms to seconds
  const totalSeconds = Math.ceil(episodeCount * delaySeconds);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formattedTime = '';
  if (minutes > 0) {
    formattedTime = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (seconds > 0) {
      formattedTime += ` ${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  } else {
    formattedTime = `${seconds} second${seconds > 1 ? 's' : ''}`;
  }

  return {
    seconds: totalSeconds,
    formattedTime
  };
}

/**
 * Calculate batch configuration for episode generation
 * Splits episodes into batches that fit within Vercel timeout constraints
 *
 * @param episodeDates - Array of episode date ranges to be created
 * @returns Batch configuration with episodes split into manageable batches
 *
 * @example
 * // With 30 episodes and RPM=10 (batch size 8):
 * calculateBatchConfiguration(episodes)
 * // Returns: 4 batches of 8, 8, 8, 6 episodes
 */
export function calculateBatchConfiguration(
  episodeDates: EpisodeDateRange[]
): BatchConfiguration {
  const maxBatchSize = getMaxBatchSize();
  const delaySeconds = getDelayBetweenRequests() / 1000;

  const batches: EpisodeBatch[] = [];
  let currentBatchNumber = 1;

  // Split episodes into batches
  for (let i = 0; i < episodeDates.length; i += maxBatchSize) {
    const batchEpisodes = episodeDates.slice(i, i + maxBatchSize);
    const batchTimeSeconds = Math.ceil(batchEpisodes.length * delaySeconds);

    batches.push({
      batchNumber: currentBatchNumber,
      episodes: batchEpisodes,
      estimatedTimeSeconds: batchTimeSeconds
    });

    currentBatchNumber++;
  }

  const totalTime = batches.reduce((sum, batch) => sum + batch.estimatedTimeSeconds, 0);

  return {
    batches,
    totalBatches: batches.length,
    episodesPerBatch: maxBatchSize,
    requiresBatching: batches.length > 1,
    totalEstimatedTimeSeconds: totalTime
  };
}
