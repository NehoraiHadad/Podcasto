'use server';

/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import from '@/lib/actions/episode/bulk' instead.
 *
 * This file provides wrapper functions that delegate to the new modular structure.
 */

import {
  previewBulkEpisodes as previewImpl,
  generateBulkEpisodes as generateImpl
} from './bulk';

export type { BulkGenerationResult, BulkGenerationPreview, EpisodeGenerationResult } from './bulk/types';

/**
 * Preview the episodes that would be created without actually creating them
 */
export async function previewBulkEpisodes(
  podcastId: string,
  startDate: Date,
  endDate: Date
) {
  return previewImpl(podcastId, startDate, endDate);
}

/**
 * Generate multiple episodes for a podcast based on a date range
 */
export async function generateBulkEpisodes(
  podcastId: string,
  startDate: Date,
  endDate: Date
) {
  return generateImpl(podcastId, startDate, endDate);
}
