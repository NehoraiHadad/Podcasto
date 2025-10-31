/**
 * URL Service - Single Source of Truth for Media URLs
 *
 * This service provides a centralized, DRY way to generate all media URLs
 * in the application. All media (images, audio) is served through proxy endpoints
 * to completely hide infrastructure URLs (CloudFront/S3) from the client.
 *
 * Benefits:
 * - Single place to change URL structure
 * - Consistent URL format across the app
 * - Infrastructure details completely hidden
 * - Easy to test and maintain
 *
 * Architecture:
 * Client → Proxy API → CloudFront/S3 → Stream to client
 *
 * Usage:
 * ```typescript
 * import { UrlService } from '@/lib/utils/url-service';
 *
 * // In database API layer
 * return {
 *   ...episode,
 *   cover_image: UrlService.episodeImage(episode.id),
 *   audio_url: UrlService.episodeAudio(episode.id)
 * };
 * ```
 */

export const UrlService = {
  /**
   * Get proxy URL for episode cover image
   * @param episodeId - Episode ID
   * @returns Proxy URL: /api/images/episodes/[id]
   */
  episodeImage: (episodeId: string): string => {
    return `/api/images/episodes/${episodeId}`;
  },

  /**
   * Get proxy URL for podcast cover image
   * @param podcastId - Podcast ID
   * @returns Proxy URL: /api/images/podcasts/[id]
   */
  podcastImage: (podcastId: string): string => {
    return `/api/images/podcasts/${podcastId}`;
  },

  /**
   * Get proxy URL for episode audio file
   * @param episodeId - Episode ID
   * @returns Proxy URL: /api/episodes/[id]/audio
   */
  episodeAudio: (episodeId: string): string => {
    return `/api/episodes/${episodeId}/audio`;
  },

  /**
   * Check if a URL is already a proxy URL (starts with /api/)
   * Useful for handling cases where URL might already be transformed
   */
  isProxyUrl: (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('/api/');
  },

  /**
   * Get fallback image URL (for cases where episode has no cover)
   * Returns null to indicate component should show placeholder
   */
  fallbackImage: (): null => {
    return null;
  }
} as const;

// Type for URL service - useful for mocking in tests
export type UrlServiceType = typeof UrlService;
