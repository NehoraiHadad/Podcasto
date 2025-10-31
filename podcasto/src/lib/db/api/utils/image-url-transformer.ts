/**
 * URL Transformer for Database API Layer
 *
 * This utility transforms S3 URLs to CloudFront URLs at the database API layer.
 * By transforming URLs server-side, we ensure:
 * - Infrastructure details (S3/CloudFront) are hidden from clients
 * - URL transformation happens once, not in every component
 * - Consistent URL format across the entire application
 * - Better performance (no client-side computation)
 *
 * Supports both image URLs and audio URLs.
 */

import { getBestImageUrl } from '@/lib/utils/image-url-utils';
import { getBestUrlForS3Object } from '@/lib/utils/s3-url-utils';

/**
 * Transform a single image URL from S3 to CloudFront
 *
 * @param url - Raw image URL from database (may be S3 URL)
 * @returns CloudFront URL if configured, otherwise original URL
 */
export function transformImageUrl(url: string | null | undefined): string | null {
  return getBestImageUrl(url);
}

/**
 * Transform podcast cover_image URL
 *
 * @param podcast - Podcast object with cover_image field
 * @returns Podcast object with transformed cover_image URL
 */
export function transformPodcastImageUrls<T extends { cover_image?: string | null }>(
  podcast: T
): T {
  return {
    ...podcast,
    cover_image: transformImageUrl(podcast.cover_image),
  };
}

/**
 * Transform episode cover_image URL
 *
 * @param episode - Episode object with cover_image field
 * @returns Episode object with transformed cover_image URL
 */
export function transformEpisodeImageUrls<T extends { cover_image?: string | null }>(
  episode: T
): T {
  return {
    ...episode,
    cover_image: transformImageUrl(episode.cover_image),
  };
}

/**
 * Transform image URLs for multiple podcasts
 *
 * @param podcasts - Array of podcast objects
 * @returns Array of podcasts with transformed cover_image URLs
 */
export function transformPodcastImageUrlsBatch<T extends { cover_image?: string | null }>(
  podcasts: T[]
): T[] {
  return podcasts.map(transformPodcastImageUrls);
}

/**
 * Transform image URLs for multiple episodes
 *
 * @param episodes - Array of episode objects
 * @returns Array of episodes with transformed cover_image URLs
 */
export function transformEpisodeImageUrlsBatch<T extends { cover_image?: string | null }>(
  episodes: T[]
): T[] {
  return episodes.map(transformEpisodeImageUrls);
}

/**
 * Transform a single audio URL from S3 to CloudFront
 *
 * @param url - Raw audio URL from database (may be S3 URL)
 * @returns CloudFront URL if configured, otherwise original URL
 */
export function transformAudioUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const { url: transformedUrl } = getBestUrlForS3Object(url, false);
  return transformedUrl;
}

/**
 * Transform episode audio_url URL
 *
 * @param episode - Episode object with audio_url field
 * @returns Episode object with transformed audio_url URL
 */
export function transformEpisodeAudioUrl<T extends { audio_url?: string | null }>(
  episode: T
): T {
  return {
    ...episode,
    audio_url: transformAudioUrl(episode.audio_url),
  };
}

/**
 * Transform both cover_image and audio_url for an episode
 *
 * @param episode - Episode object with cover_image and audio_url fields
 * @returns Episode object with transformed URLs
 */
export function transformEpisodeUrls<T extends { cover_image?: string | null; audio_url?: string | null }>(
  episode: T
): T {
  return {
    ...episode,
    cover_image: transformImageUrl(episode.cover_image),
    audio_url: transformAudioUrl(episode.audio_url),
  };
}

/**
 * Transform URLs for multiple episodes (both image and audio)
 *
 * @param episodes - Array of episode objects
 * @returns Array of episodes with transformed cover_image and audio_url URLs
 */
export function transformEpisodeUrlsBatch<T extends { cover_image?: string | null; audio_url?: string | null }>(
  episodes: T[]
): T[] {
  return episodes.map(transformEpisodeUrls);
}
