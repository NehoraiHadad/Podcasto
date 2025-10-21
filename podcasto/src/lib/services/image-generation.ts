import { AIService } from '../ai';
import { PromptGenerator, createPromptGenerator } from './prompt-generator';
import type { IImageGenerationService } from './interfaces';

/**
 * Configuration for image generation service
 */
export interface ImageGenerationConfig {
  aiService: AIService;
}

/**
 * Service for generating images from descriptions
 */
export class ImageGenerationService implements IImageGenerationService {
  private aiService: AIService;
  private promptGenerator: PromptGenerator;

  /**
   * Create a new image generation service with dependency injection
   *
   * @param aiService - The AI service to use for image generation
   */
  constructor(aiService: AIService) {
    if (!aiService) {
      throw new Error('AIService is required for ImageGenerationService');
    }
    this.aiService = aiService;
    this.promptGenerator = createPromptGenerator(
      this.aiService.getApiKey(),
      'gemini-2.0-flash'
    );
  }

  /**
   * Generate a detailed image prompt using the AI model
   */
  async generateImagePrompt(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<string> {
    return this.promptGenerator.generateImagePrompt(summary, title, episodeId, podcastId, userId);
  }

  /**
   * Generate image for an episode but don't upload (for preview)
   */
  async generateImagePreview(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<{
    success: boolean;
    imageData: Buffer | null;
    mimeType: string;
    error?: string;
    generatedFromPrompt?: string;
  }> {
    try {
      console.log(`[IMAGE_SERVICE] Generating image preview from summary`);

      // First, generate an enhanced image prompt
      // Cost tracking happens inside generateImagePrompt via GeminiTextGenerator
      const jsonPrompt = await this.generateImagePrompt(summary, title, episodeId, podcastId, userId);

      // Generate image based on the enhanced prompt
      // Cost tracking happens inside generateImage via ImageGenerator
      console.log(`[IMAGE_SERVICE] Using enhanced description for image generator`);
      const imageResult = await this.aiService.generateImage(jsonPrompt, undefined, episodeId, podcastId, userId);

      if (imageResult.imageData) {
        console.log(`[IMAGE_SERVICE] Successfully generated image preview`);
        return {
          success: true,
          imageData: imageResult.imageData,
          mimeType: imageResult.mimeType,
          generatedFromPrompt: jsonPrompt
        };
      } else {
        console.warn(`[IMAGE_SERVICE] No image data was generated`);
        return {
          success: false,
          imageData: null,
          mimeType: 'image/jpeg',
          error: 'No image data was generated',
          generatedFromPrompt: jsonPrompt
        };
      }
    } catch (error) {
      console.error(`[IMAGE_SERVICE] Error generating image preview:`, error);
      return {
        success: false,
        imageData: null,
        mimeType: 'image/jpeg',
        error: error instanceof Error ? error.message : String(error),
        generatedFromPrompt: summary
      };
    }
  }
}

/**
 * Factory function to create an ImageGenerationService
 *
 * @param aiService - The AI service instance to inject
 * @returns IImageGenerationService interface implementation
 */
export function createImageGenerationService(aiService: AIService): IImageGenerationService {
  if (!aiService) {
    throw new Error('aiService is required');
  }
  return new ImageGenerationService(aiService);
} 