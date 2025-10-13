/**
 * Type definitions for podcast image generation actions.
 */

import type { ImageAnalysis } from '@/lib/services/podcast-image-enhancer';

/**
 * Result type for image generation actions
 */
export interface ImageActionResult {
  success: boolean;
  imageUrl?: string;
  imageUrls?: string[]; // For multiple variations
  imageData?: string; // Base64 encoded image data
  imageDatas?: string[]; // Base64 encoded image data for multiple variations
  mimeType?: string; // MIME type of the image
  error?: string;
  enhancedWithAI?: boolean;
  analysis?: ImageAnalysis; // AI analysis of source image
  prompt?: string; // The prompt used to generate the image
  originalImageData?: string; // Base64 of original source image (for preview only)
}

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  style?: string;
  styleId?: string; // The style ID to save to database (e.g., 'modern-professional')
  variationsCount?: number;
}

/**
 * Single image metadata from gallery
 */
export interface GalleryImage {
  url: string;
  key: string;
  lastModified: Date;
  size: number;
  type: 'cover' | 'variant' | 'original';
}

/**
 * Result type for gallery listing
 */
export interface GalleryResult {
  success: boolean;
  images?: GalleryImage[];
  error?: string;
}
