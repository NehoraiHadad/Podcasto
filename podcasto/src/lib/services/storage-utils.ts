/**
 * @deprecated Use S3Service from './s3-service' instead
 * This file is maintained for backward compatibility
 *
 * Migration guide:
 * - Replace `createS3StorageUtils(config)` with `createS3Service(config)` or `new S3Service(config)`
 * - Replace `S3StorageUtils` class with `S3Service` class
 * - Replace `S3StorageConfig` type with `S3ServiceConfig` type
 * - All method signatures remain the same
 * - Return types are unchanged
 */

import { S3Service, createS3Service } from './s3-service';

// Re-export class with old name for backward compatibility
export { S3Service as S3StorageUtils };

// Re-export factory function with old name
export { createS3Service as createS3StorageUtils };

// Re-export types with old names
export type { S3ServiceConfig as S3StorageConfig, DetailedDeleteResult } from './s3-service-types';
