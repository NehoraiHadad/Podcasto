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

/**
 * Supported AI providers
 */
export type ProviderType = 'gemini' | 'openai';

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

  /**
   * Create a new AI service with the specified provider
   */
  constructor(config: AIServiceConfig) {
    this.provider = this.initializeProvider(config);
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