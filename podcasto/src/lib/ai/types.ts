/**
 * Common interfaces for AI integration
 */

/**
 * Required configuration for AI providers
 */
export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

/**
 * Title generation configuration
 */
export interface TitleGenerationOptions {
  maxLength?: number;
  style?: 'descriptive' | 'concise' | 'engaging' | 'humorous';
  language?: string;
}

/**
 * Summary generation configuration
 */
export interface SummaryGenerationOptions {
  maxLength?: number;
  style?: 'bullet' | 'paragraph' | 'detailed' | 'concise';
  language?: string;
}

/**
 * Image generation configuration
 */
export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  style?: string;
  format?: 'jpeg' | 'png';
}

/**
 * Results from title and summary generation
 */
export interface TitleSummaryResult {
  title: string;
  summary: string;
}

/**
 * Result from image generation
 */
export interface ImageGenerationResult {
  imageData: Buffer | null;
  imageUrl?: string;
  mimeType: string;
}

/**
 * Interface for AI providers to implement
 */
export interface AIProvider {
  /**
   * Generate a title and summary based on transcript text
   */
  generateTitleAndSummary(
    transcript: string,
    titleOptions?: TitleGenerationOptions,
    summaryOptions?: SummaryGenerationOptions
  ): Promise<TitleSummaryResult>;
  
  /**
   * Generate an image based on a description
   */
  generateImage(
    description: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult>;
} 