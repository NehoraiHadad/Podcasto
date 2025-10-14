/**
 * Constants for image management operations
 */

export const IMAGE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_MB: 5,
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ACCEPTED_MIME_PREFIX: 'image/'
} as const;

export const IMAGE_DISPLAY = {
  DEFAULT_MAX_WIDTH: '300px',
  ASPECT_RATIO: 'square' as const,
  DEFAULT_ALT_TEXT: 'Generated image'
} as const;

export const LOADING_STATES = {
  UPLOADING: 'Uploading...',
  GENERATING: 'Generating...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
  LOADING: 'Loading...'
} as const;
