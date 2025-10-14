/**
 * Shared types for image generation components
 */

import type { ImageAnalysis } from '@/lib/services/podcast-image-enhancer';
import type { GalleryImage } from '@/lib/actions/podcast';

export type ImageSource = 'telegram' | 'upload' | 'url';

export interface GeneratedVariation {
  url: string; // Data URL (data:image/jpeg;base64,...)
  base64Data: string; // The actual base64 data without prefix
  index: number;
  selected: boolean;
}

export interface GenerationDebugInfo {
  originalImageData?: string; // Base64 data of original image
  analysis?: ImageAnalysis;
  prompt?: string;
}

export interface ImageGenerationFieldProps {
  podcastId?: string;
  currentImageUrl?: string | null;
  telegramChannel?: string | null;
  podcastTitle?: string;
  savedImageStyle?: string | null;
  onImageGenerated?: (imageUrl: string) => void;
}

export type { GalleryImage };
