import { ImageGenerationOptions, ImageGenerationResult } from '../types';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../utils/retry';
import { trackCostEvent } from '@/lib/services/cost-tracker';

/**
 * Unified image generation provider for Google's Gemini AI models
 */
export class ImageGenerator {
  private apiKey: string;
  private modelName: string;
  private retryConfig: RetryConfig;

  constructor(apiKey: string, modelName?: string) {
    this.apiKey = apiKey;
    this.modelName = modelName || 'gemini-2.5-flash-image';
    this.retryConfig = DEFAULT_RETRY_CONFIG;
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
    let retryCount = 0;

    try {
      const result = await withRetry(async () => {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        // Add style context to description
        const style = options?.style || 'modern, professional';

        // Use environment variable for prompt template if available, otherwise use default
        const imagePromptTemplate = process.env.IMAGE_GENERATION_PROMPT || `
Generate an image for a podcast episode cover based on the following description:
{description}

STRICTLY ENFORCE THESE RULES:
- DO NOT include ANY text or lettering in the image
- DO NOT include podcast symbols like microphones or headphones
- Create a purely visual representation with no text elements

The image should be in {style} style, suitable for a podcast cover.
Focus on creating a visually striking image with rich colors and interesting composition.

IMPORTANT: Only generate an image based on this description. Do not provide any explanations or additional text.
`;

        // Replace placeholders in the template
        const enhancedPrompt = imagePromptTemplate
          .replace('{description}', description)
          .replace('{style}', style);

        console.log(`[IMAGE_GENERATOR] Using model: ${this.modelName}`);

        // Generate content using the new SDK
        const response = await ai.models.generateContent({
          model: this.modelName,
          contents: enhancedPrompt,
          config: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseModalities: ['image', 'text']
          }
        });

        console.log('[IMAGE_GENERATOR] Received response from AI');

        // Process the response candidates to extract image data
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
          console.warn('[IMAGE_GENERATOR] No candidates found in response');
          return {
            imageData: null,
            mimeType: 'image/jpeg',
            generatedFromPrompt: enhancedPrompt
          };
        }

        // Look for image data in the response
        let imageData: Buffer | null = null;
        let mimeType = 'image/jpeg';

        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
          const candidate = candidates[candidateIndex];
          if (!candidate.content || !candidate.content.parts) continue;

          for (let partIndex = 0; partIndex < candidate.content.parts.length; partIndex++) {
            const part = candidate.content.parts[partIndex];
            if (part.inlineData && part.inlineData.data) {
              console.log(`[IMAGE_GENERATOR] Found inline image data in candidate ${candidateIndex}, part ${partIndex}`);
              imageData = Buffer.from(part.inlineData.data, 'base64');
              mimeType = part.inlineData.mimeType || 'image/jpeg';
              break;
            } else if (part.text) {
              console.log(`[IMAGE_GENERATOR] Found text content: ${part.text.substring(0, 100)}...`);
            }
          }
          if (imageData) break;
        }

        // Track cost after successful generation
        if (imageData) {
          try {
            await trackCostEvent({
              episodeId,
              podcastId,
              eventType: 'ai_api_call',
              service: 'gemini_image',
              quantity: 1,
              unit: 'images',
              metadata: {
                model: this.modelName,
                operation: 'generateImage',
                retry_count: retryCount
              }
            });
          } catch (costError) {
            console.error('[IMAGE_GENERATOR] Cost tracking failed for generateImage:', costError);
          }

          return {
            imageData,
            mimeType,
            generatedFromPrompt: enhancedPrompt
          };
        }

        console.warn('[IMAGE_GENERATOR] No image data found in any response candidate');
        return {
          imageData: null,
          mimeType: 'image/jpeg',
          generatedFromPrompt: enhancedPrompt
        };
      }, this.retryConfig);

      return result;
    } catch (error) {
      console.error('[IMAGE_GENERATOR] Failed to generate image:', error);
      return {
        imageData: null,
        mimeType: 'image/jpeg',
        generatedFromPrompt: description
      };
    }
  }
} 