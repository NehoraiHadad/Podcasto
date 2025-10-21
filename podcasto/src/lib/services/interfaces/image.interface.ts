/**
 * Image Service Interfaces
 * Type-safe contracts for AI-powered image enhancement and analysis
 */

/**
 * Enhancement options for podcast cover images
 */
export interface EnhancementOptions {
  podcastTitle: string;
  podcastStyle?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '21:9';
  variationsCount?: number; // Number of variations to generate (1-3)
}

/**
 * Single image variation result
 */
export interface SingleVariation {
  imageData: Buffer;
  mimeType: string;
  variationIndex: number;
}

/**
 * AI analysis of image content
 */
export interface ImageAnalysis {
  description: string;
  colors: string;
  style: string;
  mainElements: string;
  mood: string;
  generationPrompt: string; // AI-generated prompt for image creation
}

/**
 * Enhancement result with variations
 */
export interface EnhancementResult {
  success: boolean;
  variations?: SingleVariation[]; // Array of generated variations
  enhancedImageData?: Buffer; // Deprecated: for backward compatibility
  mimeType: string;
  prompt?: string;
  analysis?: ImageAnalysis; // AI analysis of the source image
  originalImageUrl?: string; // URL of the original image for display
  error?: string;
}

/**
 * Podcast Image Enhancer Interface
 * Transforms input images into professional podcast cover images using AI
 */
export interface IPodcastImageEnhancer {
  /**
   * Enhance a podcast image using Gemini 2.5 Flash Image
   * Can generate multiple variations for A/B testing
   * @param sourceImageBuffer - The original image from Telegram or other source
   * @param options - Enhancement options including podcast title, style, and variations count
   * @returns Enhanced image(s) as Buffer(s) with analysis
   */
  enhanceImage(sourceImageBuffer: Buffer, options: EnhancementOptions): Promise<EnhancementResult>;

  /**
   * Create a text-only podcast cover (fallback when no source image available)
   * @param options - Enhancement options
   * @returns Generated image from text description
   */
  createFromScratch(options: EnhancementOptions): Promise<EnhancementResult>;
}

/**
 * Podcast Image Analyzer Interface
 * Analyzes images with AI to understand content and generate enhancement prompts
 */
export interface IPodcastImageAnalyzer {
  /**
   * Analyze source image to understand its content and generate a custom enhancement prompt
   * Uses Gemini 2.5 Flash for multimodal analysis with structured JSON output
   * @param sourceImageBuffer - The image buffer to analyze
   * @param podcastStyle - The desired podcast style for the enhancement (default: 'modern, professional')
   * @param episodeId - Optional episode ID for cost tracking
   * @param podcastId - Optional podcast ID for cost tracking
   * @returns Image analysis with AI-generated enhancement prompt, or null if analysis fails
   */
  analyzeImage(
    sourceImageBuffer: Buffer,
    podcastStyle?: string,
    episodeId?: string,
    podcastId?: string
  ): Promise<ImageAnalysis | null>;
}

/**
 * Image Handler Interface
 * Orchestrates image generation, storage, and episode updates
 */
export interface IImageHandler {
  /**
   * Generate image prompt from summary and title
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @param episodeId - Optional episode ID for cost tracking
   * @param podcastId - Optional podcast ID for cost tracking
   * @returns Generated image prompt
   */
  generateImagePrompt(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string
  ): Promise<string>;

  /**
   * Generate image preview (doesn't save to S3)
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @param episodeId - Optional episode ID for cost tracking
   * @param podcastId - Optional podcast ID for cost tracking
   * @returns Preview result with image data
   */
  generateImagePreview(
    summary: string,
    title?: string,
    episodeId?: string,
    podcastId?: string
  ): Promise<{
    success: boolean;
    imageData: Buffer | null;
    mimeType: string;
    error?: string;
    generatedFromPrompt?: string;
  }>;

  /**
   * Save generated image to S3 and update episode record
   * @param episodeId - Episode identifier
   * @param podcastId - Podcast identifier
   * @param imageData - Image buffer
   * @param mimeType - Image MIME type
   * @returns Save result with image URL
   */
  saveGeneratedImage(
    episodeId: string,
    podcastId: string,
    imageData: Buffer,
    mimeType: string
  ): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
  }>;

  /**
   * Generate and save episode image (complete process)
   * @param episodeId - Episode identifier
   * @param podcastId - Podcast identifier
   * @param summary - Episode summary
   * @returns Success status
   */
  generateEpisodeImage(episodeId: string, podcastId: string, summary: string): Promise<boolean>;
}
