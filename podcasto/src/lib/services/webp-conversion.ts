/**
 * WebP Conversion Service
 *
 * This module provides WebP conversion utilities to convert images to WebP format
 * before uploading to S3. This reduces storage costs and bandwidth usage.
 *
 * Option 3: WebP Conversion
 * - Converts JPEG/PNG images to WebP format
 * - WebP provides ~25-35% better compression than JPEG
 * - WebP lossless images are 26% smaller than PNG
 * - Recommended for high-traffic applications with many images
 *
 * Important Considerations:
 * - Next.js still needs to create transformations for different sizes
 * - More complex than Option 2 (JPEG compression)
 * - Best for applications with high traffic and storage cost concerns
 *
 * Based on research from:
 * - Medium article: "50% reduction in S3 storage costs by converting to WebP"
 * - WebP specification: "25-34% smaller than comparable JPEGs"
 * - Next.js docs: "WebP provides both lossless and lossy compression"
 */

import sharp from 'sharp';

/**
 * WebP conversion options
 */
export interface WebPConversionOptions {
  /**
   * Quality level for lossy compression (1-100)
   * Recommended: 75-85 for best balance
   * Default: 80 (high quality with good compression)
   */
  quality?: number;

  /**
   * Whether to use lossless compression
   * Lossless produces larger files but perfect quality
   * Default: false (use lossy compression)
   */
  lossless?: boolean;

  /**
   * Compression effort (0-6)
   * Higher values = better compression but slower
   * Default: 4 (good balance)
   */
  effort?: number;

  /**
   * Whether to strip metadata (EXIF, ICC profile, etc.)
   * Removing metadata reduces file size
   * Default: true
   */
  stripMetadata?: boolean;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  /**
   * Converted image buffer (WebP format)
   */
  buffer: Buffer;

  /**
   * Original file size in bytes
   */
  originalSize: number;

  /**
   * Converted file size in bytes
   */
  convertedSize: number;

  /**
   * Size reduction ratio (0-1)
   * Example: 0.35 means 35% reduction
   */
  sizeReduction: number;

  /**
   * MIME type of the converted image
   */
  mimeType: string;

  /**
   * Original format detected
   */
  originalFormat: string;
}

/**
 * Converts an image buffer to WebP format
 *
 * This function uses Sharp to convert JPEG/PNG images to WebP format.
 * WebP provides better compression than JPEG while maintaining quality.
 * By default, it uses 80% quality which provides excellent visual quality
 * while reducing file size by approximately 25-35%.
 *
 * @param buffer - The original image buffer (JPEG/PNG format)
 * @param options - Conversion options
 * @returns Conversion result with WebP buffer and statistics
 *
 * @example
 * ```typescript
 * const originalBuffer = Buffer.from(...); // JPEG from Gemini
 * const result = await convertToWebP(originalBuffer, { quality: 80 });
 *
 * console.log(`Original: ${result.originalSize} bytes (${result.originalFormat})`);
 * console.log(`Converted: ${result.convertedSize} bytes (WebP)`);
 * console.log(`Saved: ${result.sizeReduction * 100}%`);
 *
 * // Upload WebP buffer to S3
 * await uploadToS3(result.buffer, result.mimeType);
 * ```
 */
export async function convertToWebP(
  buffer: Buffer,
  options: WebPConversionOptions = {}
): Promise<ConversionResult> {
  const {
    quality = 80,
    lossless = false,
    effort = 4,
    stripMetadata = true,
  } = options;

  // Validate quality range
  if (quality < 1 || quality > 100) {
    throw new Error('Quality must be between 1 and 100');
  }

  // Validate effort range
  if (effort < 0 || effort > 6) {
    throw new Error('Effort must be between 0 and 6');
  }

  const originalSize = buffer.length;

  // Get original format information
  const metadata = await sharp(buffer).metadata();
  const originalFormat = metadata.format || 'unknown';

  // Process image with Sharp
  let sharpInstance = sharp(buffer);

  // Strip metadata if requested
  if (stripMetadata) {
    sharpInstance = sharpInstance.withMetadata({
      // Remove all metadata except orientation
      orientation: undefined,
    });
  }

  // Convert to WebP
  const convertedBuffer = await sharpInstance
    .webp({
      quality: lossless ? 100 : quality,
      lossless,
      effort,
      // Enable smart subsampling for better quality
      smartSubsample: true,
    })
    .toBuffer();

  const convertedSize = convertedBuffer.length;
  const sizeReduction = (originalSize - convertedSize) / originalSize;

  return {
    buffer: convertedBuffer,
    originalSize,
    convertedSize,
    sizeReduction,
    mimeType: 'image/webp',
    originalFormat,
  };
}

/**
 * Helper function to convert an image with automatic format handling
 *
 * This function detects the image format and converts it to WebP.
 * Works with JPEG, PNG, and other formats supported by Sharp.
 *
 * @param buffer - The original image buffer
 * @param mimeType - The MIME type of the image (optional, for validation)
 * @param options - Conversion options
 * @returns Conversion result
 *
 * @example
 * ```typescript
 * const { buffer, mimeType } = await generateImageFromGemini();
 * const result = await convertImageToWebP(buffer, mimeType);
 * await uploadToS3(result.buffer, result.mimeType);
 * ```
 */
export async function convertImageToWebP(
  buffer: Buffer,
  mimeType?: string,
  options: WebPConversionOptions = {}
): Promise<ConversionResult> {
  // Validate that input is not already WebP
  if (mimeType?.toLowerCase() === 'image/webp') {
    const size = buffer.length;
    return {
      buffer,
      originalSize: size,
      convertedSize: size,
      sizeReduction: 0,
      mimeType: 'image/webp',
      originalFormat: 'webp',
    };
  }

  // Convert to WebP
  return convertToWebP(buffer, options);
}

/**
 * Batch converts multiple images to WebP
 *
 * This function processes multiple images in parallel for better performance.
 *
 * @param images - Array of image buffers
 * @param options - Conversion options
 * @returns Array of conversion results
 *
 * @example
 * ```typescript
 * const images = [buffer1, buffer2, buffer3];
 * const results = await batchConvertToWebP(images, { quality: 80 });
 *
 * results.forEach((result, index) => {
 *   console.log(`Image ${index + 1}: ${result.sizeReduction * 100}% reduction`);
 * });
 * ```
 */
export async function batchConvertToWebP(
  images: Buffer[],
  options: WebPConversionOptions = {}
): Promise<ConversionResult[]> {
  return Promise.all(
    images.map(buffer => convertToWebP(buffer, options))
  );
}

/**
 * Estimates the potential savings from converting to WebP
 *
 * @param originalSize - Original file size in bytes
 * @param quality - WebP quality (1-100)
 * @returns Estimated converted size and savings
 *
 * @example
 * ```typescript
 * const estimate = estimateWebPSavings(500_000, 80);
 * console.log(`Estimated size: ${estimate.estimatedSize} bytes`);
 * console.log(`Estimated savings: ${estimate.estimatedSavings}%`);
 * ```
 */
export function estimateWebPSavings(
  originalSize: number,
  quality: number = 80
): { estimatedSize: number; estimatedSavings: number } {
  // Rough estimation based on typical WebP conversion ratios
  // Quality 80: ~30% reduction from JPEG
  // Quality 70: ~40% reduction from JPEG
  // Quality 60: ~50% reduction from JPEG

  let compressionFactor: number;

  if (quality >= 80) {
    compressionFactor = 0.7; // 30% reduction
  } else if (quality >= 70) {
    compressionFactor = 0.6; // 40% reduction
  } else if (quality >= 60) {
    compressionFactor = 0.5; // 50% reduction
  } else {
    compressionFactor = 0.4; // 60% reduction
  }

  const estimatedSize = Math.round(originalSize * compressionFactor);
  const estimatedSavings = Math.round((1 - compressionFactor) * 100);

  return {
    estimatedSize,
    estimatedSavings,
  };
}

/**
 * Compares compression quality between JPEG compression and WebP conversion
 *
 * This helper function can be used to decide which optimization to use.
 *
 * @param buffer - Original image buffer
 * @param jpegQuality - Quality for JPEG compression (1-100)
 * @param webpQuality - Quality for WebP conversion (1-100)
 * @returns Comparison results
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from(...);
 * const comparison = await compareCompressionMethods(buffer, 80, 80);
 *
 * console.log(`JPEG: ${comparison.jpeg.compressedSize} bytes`);
 * console.log(`WebP: ${comparison.webp.convertedSize} bytes`);
 * console.log(`Best: ${comparison.recommendation}`);
 * ```
 */
export async function compareCompressionMethods(
  buffer: Buffer,
  jpegQuality: number = 80,
  webpQuality: number = 80
): Promise<{
  jpeg: {
    compressedSize: number;
    reduction: number;
  };
  webp: {
    convertedSize: number;
    reduction: number;
  };
  recommendation: 'jpeg' | 'webp';
}> {
  const originalSize = buffer.length;

  // Compress to JPEG
  const jpegBuffer = await sharp(buffer)
    .jpeg({ quality: jpegQuality, mozjpeg: true })
    .toBuffer();

  // Convert to WebP
  const webpBuffer = await sharp(buffer)
    .webp({ quality: webpQuality })
    .toBuffer();

  const jpegSize = jpegBuffer.length;
  const webpSize = webpBuffer.length;

  const jpegReduction = (originalSize - jpegSize) / originalSize;
  const webpReduction = (originalSize - webpSize) / originalSize;

  return {
    jpeg: {
      compressedSize: jpegSize,
      reduction: jpegReduction,
    },
    webp: {
      convertedSize: webpSize,
      reduction: webpReduction,
    },
    recommendation: webpSize < jpegSize ? 'webp' : 'jpeg',
  };
}
