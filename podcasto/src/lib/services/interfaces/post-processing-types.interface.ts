/**
 * Post-Processing Type Definitions
 * Shared types for post-processing services
 */

/**
 * Episode object interface for post-processing
 */
export interface Episode {
  id: string;
  podcast_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  language?: string | null;
  [key: string]: unknown;
}

/**
 * Post-processing result interface
 */
export interface PostProcessingResult {
  success: boolean;
  message: string;
  episode?: Episode;
}

/**
 * Image preview result interface
 */
export interface ImagePreviewResult {
  success: boolean;
  imageData: Buffer | null;
  mimeType: string;
  generatedFromPrompt?: string;
  error?: string;
}

/**
 * Image save result interface
 */
export interface ImageSaveResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
