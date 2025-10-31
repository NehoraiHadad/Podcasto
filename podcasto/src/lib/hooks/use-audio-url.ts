/**
 * useAudioUrl Hook
 * Returns proxy URL for episode audio files
 *
 * Architecture:
 * - Returns /api/episodes/[id]/audio endpoint
 * - No server calls needed - URL is deterministic
 * - Server-side proxy handles CloudFront/S3 fetching
 * - CloudFront URLs completely hidden from client
 *
 * Benefits:
 * - Zero network calls to generate URL
 * - No caching complexity needed
 * - Infrastructure URLs never exposed to client
 */

'use client';

import { useState, useEffect } from 'react';

interface UseAudioUrlReturn {
  audioUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get audio proxy URL for episodes
 *
 * @param episodeId - The episode ID to get audio URL for
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
    // Validate episodeId
    if (!episodeId || typeof episodeId !== 'string') {
      setError('Invalid episode ID');
      setAudioUrl(null);
      setIsLoading(false);
      return;
    }

    // Generate proxy URL
    const proxyUrl = `/api/episodes/${episodeId}/audio`;
    setAudioUrl(proxyUrl);
    setError(null);
    setIsLoading(false);
  }, [episodeId]);

  return { audioUrl, isLoading, error };
}
