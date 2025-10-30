/**
 * useAudioUrl Hook
 * Client-side caching for presigned audio URLs with sessionStorage
 *
 * Features:
 * - Caches URLs in sessionStorage (cleared on tab close for security)
 * - Automatic expiration checking with safety buffer
 * - Fallback to server action on cache miss or expiration
 * - Handles corrupted cache gracefully
 */

'use client';

import { useState, useEffect } from 'react';
import { getEpisodeAudioUrl } from '@/lib/actions/episode/audio-actions';
import { EPISODE_CONSTANTS } from '@/lib/constants/episode-constants';

interface CachedAudioUrl {
  url: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

interface UseAudioUrlReturn {
  audioUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const CACHE_KEY_PREFIX = 'audio-url-';
const EXPIRATION_BUFFER_MS = 60 * 60 * 1000; // 1 hour buffer before actual expiration

/**
 * Gets the cache key for an episode
 */
function getCacheKey(episodeId: string): string {
  return `${CACHE_KEY_PREFIX}${episodeId}`;
}

/**
 * Retrieves cached URL from sessionStorage if valid
 */
function getCachedUrl(episodeId: string): string | null {
  try {
    const cached = sessionStorage.getItem(getCacheKey(episodeId));
    if (!cached) return null;

    const data: CachedAudioUrl = JSON.parse(cached);
    const now = Date.now();

    // Check if URL is expired or about to expire (within buffer period)
    if (data.expiresAt - EXPIRATION_BUFFER_MS <= now) {
      // URL expired or expiring soon, remove from cache
      sessionStorage.removeItem(getCacheKey(episodeId));
      return null;
    }

    return data.url;
  } catch (error) {
    // Cache corrupted, clear it
    console.warn('Corrupted audio URL cache, clearing:', error);
    sessionStorage.removeItem(getCacheKey(episodeId));
    return null;
  }
}

/**
 * Stores URL in sessionStorage with expiration timestamp
 */
function setCachedUrl(episodeId: string, url: string): void {
  try {
    const expiresAt = Date.now() + (EPISODE_CONSTANTS.PRESIGNED_URL_EXPIRY_SECONDS * 1000);
    const data: CachedAudioUrl = { url, expiresAt };
    sessionStorage.setItem(getCacheKey(episodeId), JSON.stringify(data));
  } catch (error) {
    // sessionStorage might be full or disabled, log but don't fail
    console.warn('Failed to cache audio URL:', error);
  }
}

/**
 * Hook to fetch and cache audio URLs for episodes
 *
 * @param episodeId - The episode ID to fetch audio URL for
 * @returns Object with audioUrl, isLoading, and error states
 *
 * @example
 * ```tsx
 * const { audioUrl, isLoading, error } = useAudioUrl(episodeId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (audioUrl) return <AudioPlayer url={audioUrl} />;
 * ```
 */
export function useAudioUrl(episodeId: string): UseAudioUrlReturn {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUrl() {
      try {
        // Check cache first
        const cachedUrl = getCachedUrl(episodeId);

        if (cachedUrl) {
          // Cache hit - return immediately
          if (isMounted) {
            setAudioUrl(cachedUrl);
            setIsLoading(false);
            setError(null);
          }
          return;
        }

        // Cache miss - fetch from server
        setIsLoading(true);
        const result = await getEpisodeAudioUrl(episodeId);

        if (!isMounted) return;

        if (result.error) {
          setError(result.error);
          setAudioUrl(null);
        } else if (result.url) {
          setAudioUrl(result.url);
          setError(null);
          // Store in cache for future use
          setCachedUrl(episodeId, result.url);
        } else {
          setError('Could not load audio URL');
          setAudioUrl(null);
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audio URL';
        setError(errorMessage);
        setAudioUrl(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchUrl();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [episodeId]);

  return { audioUrl, isLoading, error };
}
