import {
  calculateEpisodeDates,
  estimateGenerationTime,
  calculateBatchConfiguration,
  type EpisodeDateRange,
  type BatchConfiguration
} from '@/lib/utils/episode-date-calculator';

/**
 * Calculates episode dates for podcast with error handling
 */
export async function calculateEpisodeDatesForPodcast(
  startDate: Date,
  endDate: Date,
  episodeFrequency: string | number
): Promise<{
  success: boolean;
  episodeDates?: EpisodeDateRange[];
  totalEpisodes?: number;
  estimatedTime?: string;
  batchConfiguration?: BatchConfiguration;
  error?: string;
}> {
  'use server';

  // Parse episode frequency to number if it's a string
  const frequencyNumber = typeof episodeFrequency === 'string'
    ? parseInt(episodeFrequency, 10)
    : episodeFrequency;

  if (isNaN(frequencyNumber)) {
    return {
      success: false,
      error: 'Invalid episode frequency value'
    };
  }

  const calculation = calculateEpisodeDates({
    startDate,
    endDate,
    episodeFrequency: frequencyNumber
  });

  if (!calculation.success || !calculation.episodeDates) {
    return {
      success: false,
      error: calculation.error || 'Failed to calculate episode dates'
    };
  }

  // Calculate time estimate
  const timeEstimate = estimateGenerationTime(calculation.episodeDates.length);

  // Calculate batch configuration
  const batchConfig = calculateBatchConfiguration(calculation.episodeDates);

  return {
    success: true,
    episodeDates: calculation.episodeDates,
    totalEpisodes: calculation.totalEpisodes,
    estimatedTime: timeEstimate.formattedTime,
    batchConfiguration: batchConfig
  };
}
