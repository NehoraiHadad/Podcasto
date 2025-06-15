import { ImageGenerationOptions, ImageGenerationResult } from '../types';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../utils/retry';

/**
 * Unified image generation provider for Google's Gemini AI models
 */
export class ImageGenerator {
  private apiKey: string;
  private modelName: string;
  private retryConfig: RetryConfig;

  constructor(apiKey: string, modelName?: string) {
    this.apiKey = apiKey;
    this.modelName = modelName || 'gemini-2.0-flash-exp-image-generation';
    this.retryConfig = DEFAULT_RETRY_CONFIG;
  }

  /**
   * Generate an image based on a description
   */
  async generateImage(
    description: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    try {
      return await withRetry(async () => {
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
            responseModalities: ['image', 'text'],
            responseMimeType: 'text/plain'
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
        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
          const candidate = candidates[candidateIndex];
          if (!candidate.content || !candidate.content.parts) continue;
          
          for (let partIndex = 0; partIndex < candidate.content.parts.length; partIndex++) {
            const part = candidate.content.parts[partIndex];
            if (part.inlineData && part.inlineData.data) {
              console.log(`[IMAGE_GENERATOR] Found inline image data in candidate ${candidateIndex}, part ${partIndex}`);
              const imageData = Buffer.from(part.inlineData.data, 'base64');
              const mimeType = part.inlineData.mimeType || 'image/jpeg';
              return { 
                imageData, 
                mimeType,
                generatedFromPrompt: enhancedPrompt 
              };
            } else if (part.text) {
              console.log(`[IMAGE_GENERATOR] Found text content: ${part.text.substring(0, 100)}...`);
            }
          }
        }
        
        console.warn('[IMAGE_GENERATOR] No image data found in any response candidate');
        return { 
          imageData: null, 
          mimeType: 'image/jpeg',
          generatedFromPrompt: enhancedPrompt
        };
      }, this.retryConfig);
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