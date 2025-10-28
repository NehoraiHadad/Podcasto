'use server';

import { nowUTC, formatInTimezoneServer } from '@/lib/utils/date/server';
import { DEFAULT_TIMEZONE } from '@/lib/utils/date/constants';
/**
 * Episode record creation for podcast generation.
 * Creates pending episode records with metadata for tracking.
 */

import { episodesApi, podcastConfigsApi, podcastsApi } from '@/lib/db/api';
import { languageCodeToFull } from '@/lib/utils/language-mapper';
import type { DateRange, EpisodeCreationResult } from './types';

/**
 * Creates a pending episode record in the database.
 * Sets up initial metadata including generation timestamp and S3 key.
 *
 * @param podcastId - The ID of the podcast to create episode for
 * @param timestamp - ISO timestamp for tracking generation
 * @param dateRange - Optional date range for content collection
 * @param userId - Optional user ID who triggered the generation
 * @returns EpisodeCreationResult with new episode ID or error
 */
export async function createPendingEpisode(
  podcastId: string,
  timestamp: string,
  dateRange?: DateRange,
  userId?: string
): Promise<EpisodeCreationResult> {
  try {
    // Get podcast to retrieve language_code
    const podcast = await podcastsApi.getPodcastById(podcastId);
    // Convert language code to full name for Lambda
    const language = languageCodeToFull(podcast?.language_code || 'en');

    const episode = await episodesApi.createEpisode({
      podcast_id: podcastId,
      title: `Episode ${formatInTimezoneServer(nowUTC(), DEFAULT_TIMEZONE, 'dd/MM/yyyy')}`,
      description: 'Processing...',
      audio_url: '', // Empty URL initially
      status: 'pending',
      duration: 0,
      language: language,
      content_start_date: dateRange?.startDate,
      content_end_date: dateRange?.endDate,
      created_by: userId,
      metadata: JSON.stringify({
        generation_timestamp: timestamp,
        s3_key: `podcasts/${podcastId}/${timestamp}/podcast.mp3`,
        date_range: dateRange ? {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString()
        } : null
      })
    });

    console.log(`[PODCAST_GEN] Created pending episode: ${episode.id}`);

    return {
      success: true,
      episodeId: episode.id
    };
  } catch (error) {
    console.error(`[PODCAST_GEN] Error creating episode: ${error}`);
    return {
      success: false,
      error: 'Failed to create episode record'
    };
  }
}
