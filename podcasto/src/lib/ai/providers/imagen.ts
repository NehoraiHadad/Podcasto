import { ImageGenerationOptions, ImageGenerationResult } from '../types';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../utils/retry';

export class ImagenProvider {
  private apiKey: string;
  private retryConfig: RetryConfig;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.retryConfig = DEFAULT_RETRY_CONFIG;
  }

  async generateImage(
    description: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    try {
      return await withRetry(async () => {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(this.apiKey);
        
        // Add style context to description
        const style = options?.style || 'modern, professional';
        const enhancedPrompt = `
          Generate an image for a podcast episode with the following description:
          ${description}
          
          The image should be in ${style} style, suitable for a podcast cover.
          Make it visually appealing and relevant to the content.
          Create a high-quality, detailed image that represents this podcast episode.
        `;
        
        // Use Imagen model for image generation - we'll use Gemini Pro as a fallback
        // since the JavaScript SDK may not directly support Imagen yet
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-pro'
        });
        
        // Call generateContent with the prompt
        const result = await model.generateContent(enhancedPrompt);
        
        const response = result.response;
        let imageData = null;
        let mimeType = 'image/jpeg';
        
        // Safely access parts if they exist
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              // Convert base64 data to Buffer
              const base64Data = part.inlineData.data;
              imageData = Buffer.from(base64Data, 'base64');
              mimeType = part.inlineData.mimeType || 'image/jpeg';
              break;
            }
          }
        }
        
        return {
          imageData,
          mimeType
        };
      }, this.retryConfig);
    } catch (error) {
      console.error('Error generating image with Imagen:', error);
      return {
        imageData: null,
        mimeType: 'image/jpeg'
      };
    }
  }
} 