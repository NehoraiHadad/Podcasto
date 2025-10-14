import { useState, useEffect } from 'react';
import type { S3FileInfo } from '@/lib/services/s3-service-types';
import { listEpisodeS3Files } from '@/lib/actions/episode/s3-file-actions';

interface UseFilesDataProps {
  episodeId: string;
  podcastId: string;
}

/**
 * Custom hook to manage episode S3 files data loading
 *
 * @param episodeId - Episode ID
 * @param podcastId - Podcast ID
 * @returns Files data, loading state, error state, and reload function
 */
export function useFilesData({ episodeId, podcastId }: UseFilesDataProps) {
  const [files, setFiles] = useState<S3FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    const result = await listEpisodeS3Files(episodeId, podcastId);

    if (result.success && result.data) {
      setFiles(result.data);
    } else {
      setError(result.error || 'Failed to load files');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId, podcastId]);

  return {
    files,
    loading,
    error,
    loadFiles
  };
}
