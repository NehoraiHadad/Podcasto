/**
 * Utilities for constructing S3 paths
 * Provides consistent path construction across all S3 services
 */

/**
 * S3 path segments for podcasts
 */
export interface PodcastPathParams {
  podcastId: string;
  episodeId?: string;
  subPath?: string;
}

/**
 * Build S3 key for podcast resources
 * @param params - Path parameters
 * @returns S3 key path
 */
export function buildPodcastPath(params: PodcastPathParams): string {
  const { podcastId, episodeId, subPath } = params;

  let path = `podcasts/${podcastId}`;

  if (episodeId) {
    path += `/${episodeId}`;
  }

  if (subPath) {
    // Ensure subPath doesn't start with slash
    const cleanSubPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
    path += `/${cleanSubPath}`;
  }

  return path;
}

/**
 * Build S3 key for episode audio file
 */
export function buildEpisodeAudioPath(podcastId: string, episodeId: string, format: 'mp3' | 'wav' = 'mp3'): string {
  return buildPodcastPath({
    podcastId,
    episodeId,
    subPath: `podcast.${format}`
  });
}

/**
 * Build S3 key prefix for episode folder
 */
export function buildEpisodeFolderPrefix(podcastId: string, episodeId: string): string {
  return buildPodcastPath({ podcastId, episodeId }) + '/';
}

/**
 * Build S3 key prefix for podcast folder
 */
export function buildPodcastFolderPrefix(podcastId: string): string {
  return buildPodcastPath({ podcastId }) + '/';
}

/**
 * Build S3 key for episode image
 */
export function buildEpisodeImagePath(
  podcastId: string,
  episodeId: string,
  filename: string
): string {
  return buildPodcastPath({
    podcastId,
    episodeId,
    subPath: `images/${filename}`
  });
}

/**
 * Build S3 key for episode transcript
 */
export function buildEpisodeTranscriptPrefix(podcastId: string, episodeId: string): string {
  return buildPodcastPath({
    podcastId,
    episodeId,
    subPath: 'transcripts/'
  });
}

/**
 * Build S3 key for episode content
 */
export function buildEpisodeContentPath(podcastId: string, episodeId: string): string {
  return buildPodcastPath({
    podcastId,
    episodeId,
    subPath: 'content.json'
  });
}

/**
 * Parse an S3 key into podcast/episode components
 * @returns null if the key doesn't match expected podcast path format
 */
export function parseS3Key(key: string): {
  podcastId: string;
  episodeId?: string;
  subPath?: string;
} | null {
  const match = key.match(/^podcasts\/([^/]+)(?:\/([^/]+)(?:\/(.+))?)?$/);

  if (!match) {
    return null;
  }

  return {
    podcastId: match[1],
    episodeId: match[2],
    subPath: match[3]
  };
}
