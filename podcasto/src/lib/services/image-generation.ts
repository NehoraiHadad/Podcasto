import { AIService } from '../ai';
import { PromptGenerator, createPromptGenerator } from './prompt-generator';

/**
 * Configuration for image generation service
 */
export interface ImageGenerationConfig {
  aiService: AIService;
}

/**
 * Service for generating images from descriptions
 */
export class ImageGenerationService {
  private aiService: AIService;
  private promptGenerator: PromptGenerator;

  /**
   * Create a new image generation service
   */
  constructor(config: ImageGenerationConfig) {
    this.aiService = config.aiService;
    this.promptGenerator = createPromptGenerator(
      this.aiService.getApiKey(),
      'gemini-2.0-flash'
    );
  }

  /**
   * Generate a detailed image prompt using the AI model
   */
  async generateImagePrompt(summary: string, title?: string): Promise<string> {
    return this.promptGenerator.generateImagePrompt(summary, title);
  }

  /**
   * Generate image for an episode but don't upload (for preview)
   */
  async generateImagePreview(summary: string, title?: string): Promise<{ 
    success: boolean;
    imageData: Buffer | null;
    mimeType: string;
    error?: string;
    generatedFromPrompt?: string;
  }> {
    try {
      console.log(`[IMAGE_SERVICE] Generating image preview from summary`);
      
      // First, generate an enhanced image prompt
      const jsonPrompt = await this.generateImagePrompt(summary, title);
      
      // Generate image based on the enhanced prompt
      console.log(`[IMAGE_SERVICE] Using enhanced description for image generator`);
      const imageResult = await this.aiService.generateImage(jsonPrompt);
      
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
 * Create an image generation service with the specified AI service
 */
export function createImageGenerationService(aiService: AIService): ImageGenerationService {
  return new ImageGenerationService({ aiService });
} 