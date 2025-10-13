import type { S3FileInfo } from './s3-service-types';

/**
 * Helper functions for S3Service
 * Separated to keep main service file under 150 lines
 */

/**
 * Determine file type based on S3 key path
 */
export function getFileType(key: string): S3FileInfo['type'] {
  if (key.includes('/content.json')) return 'content';
  if (key.includes('/audio/')) return 'audio';
  if (key.includes('/transcripts/')) return 'transcript';
  if (key.includes('/images/')) return 'image';
  return 'other';
}

/**
 * Check if file is a text file based on extension
 */
export function isTextFile(key: string): boolean {
  const extension = key.split('.').pop()?.toLowerCase();
  return ['txt', 'json', 'md', 'log'].includes(extension || '');
}

/**
 * Sort files by type and name
 */
export function sortS3Files(files: S3FileInfo[]): S3FileInfo[] {
  return files.sort((a, b) => {
    const typeOrder = { content: 0, audio: 1, transcript: 2, image: 3, other: 4 };
    const typeCompare = typeOrder[a.type] - typeOrder[b.type];
    if (typeCompare !== 0) return typeCompare;
    return a.name.localeCompare(b.name);
  });
}
