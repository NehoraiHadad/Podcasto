import type { S3FileInfo } from '@/lib/services/s3-service-types';

/**
 * File type constants
 */
export const FILE_TYPES = {
  CONTENT: 'content',
  AUDIO: 'audio',
  TRANSCRIPT: 'transcript',
  IMAGE: 'image',
  OTHER: 'other'
} as const;

/**
 * Type guard to check if a value is a valid file type
 */
export function isValidFileType(type: string): type is S3FileInfo['type'] {
  return Object.values(FILE_TYPES).includes(type as S3FileInfo['type']);
}
