/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import from '@/lib/actions/podcast/image' instead.
 *
 * This file re-exports all image actions from the new modular structure.
 * The original 683-line file has been split into focused modules:
 * - generate-from-telegram.ts - Telegram channel image generation
 * - generate-from-file.ts - File upload image generation
 * - generate-from-url.ts - URL-based image generation
 * - upload-to-s3.ts - S3 upload operations
 * - gallery-actions.ts - Gallery listing and deletion
 * - database-actions.ts - Database operations
 * - shared.ts - Shared utilities
 * - types.ts - Type definitions
 */

// Re-export everything from the new modular structure
export * from './image';
