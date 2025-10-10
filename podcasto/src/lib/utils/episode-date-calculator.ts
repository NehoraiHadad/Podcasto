/**
 * Episode Date Calculator Utility
 *
 * Calculates episode creation dates based on podcast frequency settings
 */

export interface EpisodeDateRange {
  startDate: Date;
  endDate: Date;
  episodeNumber: number;
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
 * Maximum number of episodes that can be created in a single bulk operation
 */
const MAX_BULK_EPISODES = 30;

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

    // Check if we've exceeded the maximum
    if (episodeDates.length >= MAX_BULK_EPISODES) {
      return {
        success: false,
        error: `Maximum of ${MAX_BULK_EPISODES} episodes can be created at once. Please reduce the date range.`
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
 */
export function formatDateRange(range: EpisodeDateRange): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
}

/**
 * Calculate estimated time for bulk episode generation
 * Based on rate limiting constraints (6 seconds between episodes)
 */
export function estimateGenerationTime(episodeCount: number): {
  seconds: number;
  formattedTime: string;
} {
  const DELAY_BETWEEN_EPISODES = 6; // seconds
  const totalSeconds = episodeCount * DELAY_BETWEEN_EPISODES;

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
