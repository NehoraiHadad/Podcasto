import type {
  AIProvider,
  AIProviderConfig,
  ImageGenerationOptions,
  ImageGenerationResult,
  TitleGenerationOptions,
  SummaryGenerationOptions,
  TitleSummaryResult
} from './types';
import { GeminiProvider } from './providers/gemini';
import { ImagenProvider } from './providers/imagen';

/**
 * Supported AI providers
 */
export type ProviderType = 'gemini' | 'openai' | 'imagen';

/**
 * AI service configuration options
 */
export interface AIServiceConfig {
  provider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

/**
 * AI service for podcast post-processing
 */
export class AIService {
  private provider: AIProvider;
  private imagenProvider?: ImagenProvider;

  /**
   * Create a new AI service with the specified provider
   */
  constructor(config: AIServiceConfig) {
    this.provider = this.initializeProvider(config);
    
    // Initialize Imagen provider for image generation if using Gemini for other tasks
    if (config.provider === 'gemini') {
      this.imagenProvider = new ImagenProvider(config.apiKey);
    }
  }

  /**
   * Initialize the appropriate provider based on configuration
   */
  private initializeProvider(config: AIServiceConfig): AIProvider {
    const providerConfig: AIProviderConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      modelName: config.modelName
    };

    switch (config.provider) {
      case 'gemini':
        return new GeminiProvider(providerConfig);
      case 'imagen':
        // Create a wrapper that implements AIProvider but uses ImagenProvider for images
        const imagenProvider = new ImagenProvider(config.apiKey);
        const geminiProvider = new GeminiProvider(providerConfig); // Use Gemini for text generation
        return {
          generateImage: (desc, opts) => imagenProvider.generateImage(desc, opts),
          generateTitleAndSummary: (transcript, titleOptions, summaryOptions) => 
            geminiProvider.generateTitleAndSummary(transcript, titleOptions, summaryOptions)
        };
      default:
        // Default to Gemini if provider not recognized
        return new GeminiProvider(providerConfig);
    }
  }

  /**
   * Generate a title and summary based on transcript text
   */
  async generateTitleAndSummary(
    transcript: string,
    titleOptions?: TitleGenerationOptions,
    summaryOptions?: SummaryGenerationOptions
  ): Promise<TitleSummaryResult> {
    return await this.provider.generateTitleAndSummary(
      transcript,
      titleOptions,
      summaryOptions
    );
  }

  /**
   * Generate an image based on a description
   */
  async generateImage(
    description: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    // Try to use Imagen provider if available, otherwise fallback to the default provider
    if (this.imagenProvider) {
      try {
        const result = await this.imagenProvider.generateImage(description, options);
        if (result.imageData) {
          return result;
        }
      } catch (error) {
        console.warn('Imagen image generation failed, falling back to default provider:', error);
      }
    }
    
    // Use the default provider as fallback
    return await this.provider.generateImage(description, options);
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
  AIProviderConfig,
  ImageGenerationOptions,
  ImageGenerationResult,
  TitleGenerationOptions,
  SummaryGenerationOptions,
  TitleSummaryResult
} from './types'; 