/**
 * Service for enhancing podcast cover images using AI
 * Takes an input image (e.g., from Telegram) and creates a professional podcast cover
 */

import { ImageGenerator } from '../ai/providers';
import { PodcastImageAnalyzer } from './podcast-image-analyzer';
import { detectImageMimeType, createEnhancementPrompt, createFromScratchPrompt } from './podcast-image-utils';

export interface EnhancementOptions {
  podcastTitle: string;
  podcastStyle?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '21:9';
  variationsCount?: number; // Number of variations to generate (1-3)
}

export interface SingleVariation {
  imageData: Buffer;
  mimeType: string;
  variationIndex: number;
}

export interface ImageAnalysis {
  description: string;
  colors: string;
  style: string;
  mainElements: string;
  mood: string;
  generationPrompt: string; // AI-generated prompt for image creation
}

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
 * Service for enhancing podcast images with AI
 * Orchestrates image analysis and enhancement using Gemini 2.5 Flash
 */
export class PodcastImageEnhancer {
  private imageGenerator: ImageGenerator;
  private analyzer: PodcastImageAnalyzer;

  constructor(apiKey: string) {
    this.imageGenerator = new ImageGenerator(apiKey, 'gemini-2.5-flash-image');
    this.analyzer = new PodcastImageAnalyzer(apiKey);
  }

  /**
   * Enhance a podcast image using Gemini 2.5 Flash Image
   * Can generate multiple variations for A/B testing
   *
   * @param sourceImageBuffer - The original image from Telegram or other source
   * @param options - Enhancement options including podcast title, style, and variations count
   * @returns Enhanced image(s) as Buffer(s)
   */
  async enhanceImage(
    sourceImageBuffer: Buffer,
    options: EnhancementOptions
  ): Promise<EnhancementResult> {
    const variationsCount = options.variationsCount || 1;

    // Analyze the image first (AI will also generate the enhancement prompt)
    const analysis = await this.analyzer.analyzeImage(
      sourceImageBuffer,
      options.podcastStyle || 'modern, professional'
    );

    // Generate multiple variations in parallel
    if (variationsCount > 1) {
      return this.enhanceImageMultiple(sourceImageBuffer, options, variationsCount, analysis);
    }

    // Single variation (original behavior)
    return this.enhanceImageSingle(sourceImageBuffer, options, analysis);
  }

  /**
   * Generate a single enhanced image
   */
  private async enhanceImageSingle(
    sourceImageBuffer: Buffer,
    options: EnhancementOptions,
    analysis: ImageAnalysis | null
  ): Promise<EnhancementResult> {
    try {
      console.log(`[PODCAST_ENHANCER] Starting image enhancement for: ${options.podcastTitle}`);

      // Convert buffer to base64
      const base64Image = sourceImageBuffer.toString('base64');

      // Get MIME type using shared utility
      const mimeType = detectImageMimeType(sourceImageBuffer);

      console.log(`[PODCAST_ENHANCER] Source image: ${mimeType}, ${sourceImageBuffer.length} bytes`);

      // Use Gemini with multimodal input (image + text)
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      // Use AI-generated prompt if available, otherwise use shared utility
      const enhancementPrompt = analysis?.generationPrompt
        ? analysis.generationPrompt
        : createEnhancementPrompt(options, analysis);

      console.log(`[PODCAST_ENHANCER] Using ${analysis?.generationPrompt ? 'AI-generated' : 'hardcoded'} prompt`);
      console.log(`[PODCAST_ENHANCER] Prompt: ${enhancementPrompt.substring(0, 200)}...`);

      // Call Gemini with both image and text
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
          {
            parts: [
              // First the image
              {
                inlineData: {
                  data: base64Image,
                  mimeType
                }
              },
              // Then the text instruction
              {
                text: enhancementPrompt
              }
            ]
          }
        ],
        config: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseModalities: ['Image'] // Only image output
        }
      });

      console.log('[PODCAST_ENHANCER] Received response from Gemini');

      // Extract image from response
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        console.warn('[PODCAST_ENHANCER] No candidates in response');
        return {
          success: false,
          mimeType: 'image/jpeg',
          error: 'No image generated by AI'
        };
      }

      // Find image data in response
      for (const candidate of candidates) {
        if (!candidate.content?.parts) continue;

        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            console.log('[PODCAST_ENHANCER] Found enhanced image in response');
            const enhancedImageData = Buffer.from(part.inlineData.data, 'base64');
            const outputMimeType = part.inlineData.mimeType || 'image/jpeg';

            console.log(`[PODCAST_ENHANCER] Enhanced image: ${outputMimeType}, ${enhancedImageData.length} bytes`);

            return {
              success: true,
              enhancedImageData,
              variations: [{
                imageData: enhancedImageData,
                mimeType: outputMimeType,
                variationIndex: 0
              }],
              mimeType: outputMimeType,
              prompt: enhancementPrompt,
              analysis: analysis || undefined
            };
          }
        }
      }

      console.warn('[PODCAST_ENHANCER] No image data found in response');
      return {
        success: false,
        mimeType: 'image/jpeg',
        error: 'No image data in AI response'
      };

    } catch (error) {
      console.error('[PODCAST_ENHANCER] Error enhancing image:', error);
      return {
        success: false,
        mimeType: 'image/jpeg',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple variations in parallel
   * Delegates to multi-variation module to keep this file focused
   */
  private async enhanceImageMultiple(
    sourceImageBuffer: Buffer,
    options: EnhancementOptions,
    count: number,
    analysis: ImageAnalysis | null
  ): Promise<EnhancementResult> {
    const { enhanceImageMultiple } = await import('./podcast-image-enhancer-multi');
    return enhanceImageMultiple(
      process.env.GEMINI_API_KEY!,
      sourceImageBuffer,
      options,
      count,
      analysis
    );
  }

  /**
   * Create a text-only podcast cover (fallback when no source image available)
   */
  async createFromScratch(options: EnhancementOptions): Promise<EnhancementResult> {
    try {
      console.log(`[PODCAST_ENHANCER] Creating image from scratch for: ${options.podcastTitle}`);

      const textPrompt = createFromScratchPrompt(options);

      const result = await this.imageGenerator.generateImage(textPrompt, {
        style: options.podcastStyle || 'modern, professional podcast cover'
      });

      if (result.imageData) {
        return {
          success: true,
          enhancedImageData: result.imageData,
          mimeType: result.mimeType,
          prompt: textPrompt
        };
      }

      return {
        success: false,
        mimeType: 'image/jpeg',
        error: 'Failed to generate image from text'
      };

    } catch (error) {
      console.error('[PODCAST_ENHANCER] Error creating image from scratch:', error);
      return {
        success: false,
        mimeType: 'image/jpeg',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Create a podcast image enhancer with the specified API key
 */
export function createPodcastImageEnhancer(apiKey: string): PodcastImageEnhancer {
  return new PodcastImageEnhancer(apiKey);
}
