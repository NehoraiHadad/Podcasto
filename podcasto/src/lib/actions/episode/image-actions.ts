'use server';

// Re-export all image-related actions from the modular structure
import { generateEpisodeImage } from './image/generate-image';
import { generateEpisodeImagePreview } from './image/generate-preview';
import { saveEpisodeImagePreview } from './image/save-preview';

// Export each async function individually
export {
  generateEpisodeImage,
  generateEpisodeImagePreview,
  saveEpisodeImagePreview
}; 