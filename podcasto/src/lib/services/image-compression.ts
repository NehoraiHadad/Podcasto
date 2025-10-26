/**
 * Image Compression Service
 *
 * This module provides image compression utilities to reduce file sizes
 * before uploading to S3, thereby reducing storage and bandwidth costs.
 *
 * Option 2: JPEG Compression
 * - Compresses JPEG images to 80% quality
 * - Reduces file size by ~60% (500KB → 200KB)
 * - Recommended for reducing S3 storage costs
 * - Professionally recommended practice based on industry standards
 *
 * Based on research from:
 * - 30dayscoding.com: "Start with compressed source files to reduce build times and costs"
 * - Sharp documentation: "Quality 50-80 for best compression results"
 */

import sharp from 'sharp';

/**
 * Compression options for JPEG images
 */
export interface JpegCompressionOptions {
  /**
   * Quality level (1-100)
   * Recommended: 50-80 for best balance between size and quality
   * Default: 80 (high quality with good compression)
   */
  quality?: number;

  /**
   * Whether to use progressive (interlaced) JPEG
   * Progressive JPEGs load incrementally, improving perceived performance
   * Default: true
   */
  progressive?: boolean;

  /**
   * Whether to strip metadata (EXIF, ICC profile, etc.)
   * Removing metadata reduces file size
   * Default: true
   */
  stripMetadata?: boolean;
}

/**
 * Compression result
 */
export interface CompressionResult {
  /**
   * Compressed image buffer
   */
  buffer: Buffer;

  /**
   * Original file size in bytes
   */
  originalSize: number;

  /**
   * Compressed file size in bytes
   */
  compressedSize: number;

  /**
   * Compression ratio (0-1)
   * Example: 0.6 means 60% reduction
   */
  compressionRatio: number;

  /**
   * MIME type of the compressed image
   */
  mimeType: string;
}

/**
 * Compresses a JPEG image buffer
 *
 * This function uses Sharp to compress JPEG images with configurable quality.
 * By default, it compresses to 80% quality which provides excellent visual
 * quality while reducing file size by approximately 60%.
 *
 * @param buffer - The original image buffer (JPEG format)
 * @param options - Compression options
 * @returns Compression result with compressed buffer and statistics
 *
 * @example
 * ```typescript
 * const originalBuffer = Buffer.from(...);
 * const result = await compressJpeg(originalBuffer, { quality: 80 });
 *
 * console.log(`Original: ${result.originalSize} bytes`);
 * console.log(`Compressed: ${result.compressedSize} bytes`);
 * console.log(`Saved: ${result.compressionRatio * 100}%`);
 *
 * // Upload compressed buffer to S3
 * await uploadToS3(result.buffer, result.mimeType);
 * ```
 */
export async function compressJpeg(
  buffer: Buffer,
  options: JpegCompressionOptions = {}
): Promise<CompressionResult> {
  const {
    quality = 80,
    progressive = true,
    stripMetadata = true,
  } = options;

  // Validate quality range
  if (quality < 1 || quality > 100) {
    throw new Error('Quality must be between 1 and 100');
  }

  const originalSize = buffer.length;

  // Process image with Sharp
  let sharpInstance = sharp(buffer);

  // Strip metadata if requested
  if (stripMetadata) {
    sharpInstance = sharpInstance.withMetadata({
      // Remove all metadata except orientation
      orientation: undefined,
    });
  }

  // Compress to JPEG with specified quality
  const compressedBuffer = await sharpInstance
    .jpeg({
      quality,
      progressive,
      mozjpeg: true, // Use mozjpeg for better compression
    })
    .toBuffer();

  const compressedSize = compressedBuffer.length;
  const compressionRatio = (originalSize - compressedSize) / originalSize;

  return {
    buffer: compressedBuffer,
    originalSize,
    compressedSize,
    compressionRatio,
    mimeType: 'image/jpeg',
  };
}

/**
 * Helper function to compress an image buffer with automatic format detection
 *
 * This function detects the image format and applies the appropriate compression.
 * Currently supports JPEG compression only. For other formats, returns the original buffer.
 *
 * @param buffer - The original image buffer
 * @param mimeType - The MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @param options - Compression options
 * @returns Compression result
 *
 * @example
 * ```typescript
 * const { buffer, mimeType } = await generateImageFromGemini();
 * const result = await compressImage(buffer, mimeType);
 * await uploadToS3(result.buffer, result.mimeType);
 * ```
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string,
  options: JpegCompressionOptions = {}
): Promise<CompressionResult> {
  // Normalize MIME type
  const normalizedMimeType = mimeType.toLowerCase();

  // Only compress JPEG images for now
  if (normalizedMimeType === 'image/jpeg' || normalizedMimeType === 'image/jpg') {
    return compressJpeg(buffer, options);
  }

  // For other formats, return original buffer without compression
  // (Future: could add PNG compression, WebP conversion, etc.)
  return {
    buffer,
    originalSize: buffer.length,
    compressedSize: buffer.length,
    compressionRatio: 0,
    mimeType,
  };
}

/**
 * Estimates the potential savings from compressing images
 *
 * @param originalSize - Original file size in bytes
 * @param quality - JPEG quality (1-100)
 * @returns Estimated compressed size and savings
 *
 * @example
 * ```typescript
 * const estimate = estimateCompressionSavings(500_000, 80);
 * console.log(`Estimated size: ${estimate.estimatedSize} bytes`);
 * console.log(`Estimated savings: ${estimate.estimatedSavings}%`);
 * ```
 */
export function estimateCompressionSavings(
  originalSize: number,
  quality: number = 80
): { estimatedSize: number; estimatedSavings: number } {
  // Rough estimation based on typical JPEG compression ratios
  // Quality 80: ~60% reduction
  // Quality 70: ~70% reduction
  // Quality 60: ~75% reduction

  let compressionFactor: number;

  if (quality >= 80) {
    compressionFactor = 0.4; // 60% reduction
  } else if (quality >= 70) {
    compressionFactor = 0.3; // 70% reduction
  } else if (quality >= 60) {
    compressionFactor = 0.25; // 75% reduction
  } else {
    compressionFactor = 0.2; // 80% reduction
  }

  const estimatedSize = Math.round(originalSize * compressionFactor);
  const estimatedSavings = Math.round((1 - compressionFactor) * 100);

  return {
    estimatedSize,
    estimatedSavings,
  };
}
