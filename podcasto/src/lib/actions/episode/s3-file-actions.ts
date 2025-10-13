/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import from '@/lib/actions/episode/s3' instead.
 *
 * This file re-exports all S3 file actions from the new modular structure.
 *
 * @deprecated Import from '@/lib/actions/episode/s3' for better maintainability
 */

export {
  listEpisodeS3Files,
  getS3FileContent,
  deleteS3File,
  deleteAllEpisodeS3Files,
  getS3FileMetadata,
  type S3FileActionResult,
  type S3FileInfo,
  type S3FileContent
} from './s3';
