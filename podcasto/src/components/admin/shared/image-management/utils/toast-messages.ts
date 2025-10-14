import { toast } from 'sonner';

/**
 * Standard toast messages for image management operations.
 * Centralizes all user-facing messages for consistency and future i18n support.
 */
export const imageToasts = {
  // ========================================
  // VALIDATION ERRORS
  // ========================================

  noFile: () => toast.error('Please select an image file first'),

  invalidFileType: () => toast.error('Please upload an image file'),

  fileTooLarge: (maxSizeMB: number = 5) =>
    toast.error(`Image must be smaller than ${maxSizeMB}MB`),

  noPodcast: () => toast.error('Episode has no associated podcast'),

  noPreview: () => toast.error('No preview image to save'),

  noTelegramChannel: () => toast.error('No Telegram channel configured'),

  noImageUrl: () => toast.error('Please enter an image URL'),

  savePodcastFirst: () => toast.error('Please save the podcast first'),

  // ========================================
  // SUCCESS MESSAGES
  // ========================================

  uploadSuccess: () => toast.success('Image uploaded successfully'),

  generationSuccess: (count: number = 1, enhanced: boolean = false) => {
    const enhancementNote = enhanced ? ' (AI enhanced)' : '';
    const message = count > 1
      ? `Generated ${count} variations${enhancementNote}! Select your favorite.`
      : `Image generated successfully${enhancementNote}!`;
    return toast.success(message);
  },

  saveSuccess: () => toast.success('Image saved successfully'),

  deleteSuccess: () => toast.success('Image deleted successfully'),

  variationDeleted: (wasSelected: boolean) => {
    const message = wasSelected
      ? 'Variation deleted. First variation selected.'
      : 'Variation deleted';
    return toast.success(message);
  },

  selectionSuccess: () => toast.success('Image selected!'),

  galleryLoadSuccess: (count: number) =>
    toast.success(`Found ${count} images in gallery`),

  imageSelectedFromGallery: () =>
    toast.success('Image selected from gallery!'),

  imageRemoved: () => toast.success('Image removed'),

  // ========================================
  // INFO MESSAGES
  // ========================================

  previewDiscarded: () => toast.info('Preview discarded'),

  galleryEmpty: () =>
    toast.info('No images found in gallery. Generate some images first!'),

  // ========================================
  // WARNING MESSAGES
  // ========================================

  noPreviewProduced: () =>
    toast.warning('Image generation completed but no preview was produced'),

  noUrlReturned: () =>
    toast.warning('Image saving completed but no URL was returned'),

  // ========================================
  // GENERIC ERROR HANDLERS
  // ========================================

  error: (message: string) => toast.error(message),

  errorFromException: (error: unknown, fallback: string) =>
    toast.error(error instanceof Error ? error.message : fallback),

  loadGalleryError: (error?: string) =>
    toast.error(error || 'Failed to load gallery'),

  deleteGalleryImageError: (error?: string) =>
    toast.error(error || 'Failed to delete image'),
} as const;
