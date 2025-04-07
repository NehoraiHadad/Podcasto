'use server';

// Re-export all episode actions from the modular structure
// This maintains backward compatibility with existing imports
import { getEpisodeAudioUrl, regenerateEpisodeAudio } from './episode/audio-actions';
import { generateEpisodeImage, generateEpisodeImagePreview, saveEpisodeImagePreview } from './episode/image-actions';
import { deleteEpisode, updateEpisodeDetails } from './episode/core-actions';

// Export each async function individually
export { 
  getEpisodeAudioUrl,
  regenerateEpisodeAudio,
  generateEpisodeImage, 
  generateEpisodeImagePreview, 
  saveEpisodeImagePreview,
  deleteEpisode, 
  updateEpisodeDetails
}; 