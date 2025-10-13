/**
 * @deprecated Use S3Service from './s3-service' instead
 * This file is maintained for backward compatibility
 *
 * Migration guide:
 * - Replace `s3FileService` with `createS3Service()` or instantiate `new S3Service()`
 * - All method signatures remain the same
 * - Return types are unchanged
 */

import { S3Service, createS3Service } from './s3-service';

// Export the singleton instance for backward compatibility
export const s3FileService = createS3Service();

// Re-export class for advanced usage
export { S3Service as S3FileService };

// Re-export types
export type { S3FileInfo, S3FileContent } from './s3-service-types';
