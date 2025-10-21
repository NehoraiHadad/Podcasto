import type {
  AIProvider,
  AIProviderConfig,
  ImageGenerationOptions,
  ImageGenerationResult,
  TitleGenerationOptions,
  SummaryGenerationOptions,
  TitleSummaryResult,
  AIServiceConfig
} from './types';
import { ImageGenerator } from './providers';
import { initializeProvider } from './utils/provider-initializer';

/**
 * AI service for podcast post-processing
 */
export class AIService {
  private provider: AIProvider;
  private imageGenerator: ImageGenerator;
  private fallbackProvider?: AIProvider;
  private apiKey: string;
  private fallbackApiKey?: string;

  /**
   * Create a new AI service with the specified provider
   */
  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
    this.fallbackApiKey = config.fallbackApiKey;

    // Use the imported initializer function
    const providerConfig: AIProviderConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      modelName: config.modelName
    };
    this.provider = initializeProvider(config.provider, providerConfig);

    this.imageGenerator = new ImageGenerator(config.apiKey);

    // Initialize fallback provider if configured
    if (config.fallbackProvider && config.fallbackApiKey) {
      const fallbackProviderConfig: AIProviderConfig = {
        apiKey: config.fallbackApiKey,
        baseUrl: config.baseUrl, // Assuming same base URL and model for fallback
        modelName: config.modelName
      };
      this.fallbackProvider = initializeProvider(config.fallbackProvider, fallbackProviderConfig);
      console.log(`[AI_SERVICE] Initialized fallback provider: ${config.fallbackProvider}`);
    }
  }

  /**
   * Get the API key for the primary provider
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the API key for the fallback provider if available
   */
  getFallbackApiKey(): string | undefined {
    return this.fallbackApiKey;
  }

  /**
   * Generate a title and summary based on transcript text
   */
  async generateTitleAndSummary(
    transcript: string,
    titleOptions?: TitleGenerationOptions,
    summaryOptions?: SummaryGenerationOptions,
    episodeId?: string,
    podcastId?: string
  ): Promise<TitleSummaryResult> {
    try {
      console.log(`[AI_SERVICE] Generating title and summary using primary provider`);
      return await this.provider.generateTitleAndSummary(
        transcript,
        titleOptions,
        summaryOptions,
        episodeId,
        podcastId
      );
    } catch (error) {
      console.error(`[AI_SERVICE] Error generating title/summary with primary provider:`, error);

      // Try fallback provider if available
      if (this.fallbackProvider) {
        console.log(`[AI_SERVICE] Attempting to use fallback provider for title/summary generation`);
        try {
          return await this.fallbackProvider.generateTitleAndSummary(
            transcript,
            titleOptions,
            summaryOptions,
            episodeId,
            podcastId
          );
        } catch (fallbackError) {
          console.error(`[AI_SERVICE] Fallback provider also failed for title/summary:`, fallbackError);
        }
      }

      // No fallback or fallback failed, re-throw the original error
      throw error;
    }
  }

  /**
   * Generate an image based on a description
   */
  async generateImage(
    description: string,
    options?: ImageGenerationOptions,
    episodeId?: string,
    podcastId?: string
  ): Promise<ImageGenerationResult> {
    console.log(`[AI_SERVICE] Starting image generation for prompt: "${description.substring(0, 50)}..."`);

    try {
      // First try with the dedicated image generator
      const result = await this.imageGenerator.generateImage(description, options, episodeId, podcastId);
      if (result.imageData) {
        return result;
      }

      // If the image generator didn't produce an image, try the text provider
      console.log(`[AI_SERVICE] Dedicated image generator returned no image, trying primary provider`);
      const primaryResult = await this.provider.generateImage(description, options, episodeId, podcastId);
      if (primaryResult.imageData) {
        return primaryResult;
      }

      // Try fallback provider as last resort
      if (this.fallbackProvider) {
        console.log(`[AI_SERVICE] Primary provider returned no image, trying fallback provider`);
        const fallbackResult = await this.fallbackProvider.generateImage(description, options, episodeId, podcastId);
        if (fallbackResult.imageData) {
          return fallbackResult;
        }
      }

      // If we reached here, no successful image was generated
      console.warn(`[AI_SERVICE] All providers failed to generate an image`);
      return { imageData: null, mimeType: 'image/jpeg' };
    } catch (error) {
      console.error(`[AI_SERVICE] Error generating image:`, error);

      // Try fallback provider if available and not already tried
      if (this.fallbackProvider) {
        console.log(`[AI_SERVICE] Attempting to use fallback provider for image generation`);
        try {
          return await this.fallbackProvider.generateImage(description, options, episodeId, podcastId);
        } catch (fallbackError) {
          console.error(`[AI_SERVICE] Fallback provider also failed for image generation:`, fallbackError);
        }
      }

      // Return empty result after all failures
      return { imageData: null, mimeType: 'image/jpeg' };
    }
  }
}

/**
 * Create an AI service with the specified configuration
 */
export function createAIService(config: AIServiceConfig): AIService {
  return new AIService(config);
}

// Re-export types
export type {
  AIProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
  TitleGenerationOptions,
  SummaryGenerationOptions,
  TitleSummaryResult,
  AIServiceConfig
} from './types'; 