/**
 * Service for enhancing podcast cover images using AI
 * Takes an input image (e.g., from Telegram) and creates a professional podcast cover
 */

import { ImageGenerator } from '../ai/providers';

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
 */
export class PodcastImageEnhancer {
  private imageGenerator: ImageGenerator;

  constructor(apiKey: string) {
    this.imageGenerator = new ImageGenerator(apiKey, 'gemini-2.5-flash-image');
  }

  /**
   * Analyze the source image to understand its content
   * This will be used to create a more targeted enhancement prompt
   */
  async analyzeImage(sourceImageBuffer: Buffer): Promise<ImageAnalysis | null> {
    try {
      console.log('[PODCAST_ENHANCER] Analyzing source image...');

      const base64Image = sourceImageBuffer.toString('base64');
      const mimeType = this.detectMimeType(sourceImageBuffer);

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const analysisPrompt = `Analyze this image in detail. Provide a structured analysis:

1. **Description**: What is shown in the image? (2-3 sentences)
2. **Colors**: What are the dominant colors and color scheme?
3. **Style**: What is the visual style? (e.g., minimalist, vibrant, professional, artistic)
4. **Main Elements**: What are the key visual elements or subjects?
5. **Mood**: What mood or feeling does it convey?

Format your response as JSON with these exact keys: description, colors, style, mainElements, mood`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: analysisPrompt }
          ]
        }],
        config: {
          temperature: 0.3,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        console.warn('[PODCAST_ENHANCER] No analysis text in response');
        return null;
      }

      const analysisText = candidate.content.parts[0].text;
      const analysis = JSON.parse(analysisText) as ImageAnalysis;

      console.log('[PODCAST_ENHANCER] Analysis completed:', analysis);
      return analysis;

    } catch (error) {
      console.error('[PODCAST_ENHANCER] Error analyzing image:', error);
      return null;
    }
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

    // Analyze the image first
    const analysis = await this.analyzeImage(sourceImageBuffer);

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

      // Get MIME type (assume JPEG if not specified)
      const mimeType = this.detectMimeType(sourceImageBuffer);

      console.log(`[PODCAST_ENHANCER] Source image: ${mimeType}, ${sourceImageBuffer.length} bytes`);

      // Use Gemini with multimodal input (image + text)
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      // Create an enhanced prompt for podcast cover creation
      const enhancementPrompt = this.createEnhancementPrompt(options, analysis);

      console.log(`[PODCAST_ENHANCER] Sending to Gemini with prompt: ${enhancementPrompt.substring(0, 150)}...`);

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

      const textPrompt = this.createFromScratchPrompt(options);

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

  /**
   * Create enhancement prompt based on podcast metadata and image analysis
   */
  private createEnhancementPrompt(options: EnhancementOptions, analysis: ImageAnalysis | null): string {
    const style = options.podcastStyle || 'modern, professional';

    // Build dynamic prompt based on analysis
    let prompt = `Transform this image into a professional podcast cover art.

**Podcast Title:** ${options.podcastTitle}

**Target Style:** ${style}, podcast cover art, professional, eye-catching
`;

    if (analysis) {
      prompt += `
**Source Image Analysis:**
- Description: ${analysis.description}
- Dominant Colors: ${analysis.colors}
- Current Style: ${analysis.style}
- Main Elements: ${analysis.mainElements}
- Mood: ${analysis.mood}

**Enhancement Instructions Based on Analysis:**
1. PRESERVE: Keep these elements - ${analysis.mainElements}
2. ENHANCE: The ${analysis.colors} color palette, making it more vibrant and saturated
3. ADAPT: Transform the ${analysis.style} style into a ${style} aesthetic
4. MAINTAIN: The ${analysis.mood} mood while making it more polished
5. Make it suitable for a podcast cover (square format, clean composition)
6. DO NOT add text, titles, or any lettering
7. DO NOT include podcast symbols (microphones, headphones)
8. Focus on creating a visually striking, professional result

Generate ONLY the enhanced image, no text or explanations.`;
    } else {
      // Fallback to generic prompt if no analysis
      prompt += `
**Requirements:**
1. Keep the main visual elements and color scheme from the source image
2. Make it suitable for a podcast cover (square format, clean composition)
3. Enhance the colors to be more vibrant and eye-catching
4. Add subtle podcast-appropriate styling (${style} aesthetic)
5. Maintain brand consistency with the source image
6. DO NOT add text, titles, or any lettering
7. DO NOT include podcast symbols (microphones, headphones)
8. Focus on creating a visually striking, professional result

Generate ONLY the enhanced image, no text or explanations.`;
    }

    return prompt;
  }

  /**
   * Create from-scratch prompt for text-only generation
   */
  private createFromScratchPrompt(options: EnhancementOptions): string {
    const style = options.podcastStyle || 'modern, professional';

    return `Create a professional podcast cover art for a podcast titled "${options.podcastTitle}".

**Requirements:**
- ${style} aesthetic
- Visually striking and professional
- Suitable for podcast platforms
- Rich, vibrant colors
- Interesting composition
- DO NOT include ANY text or lettering
- DO NOT include podcast symbols (microphones, headphones)
- Focus on abstract or thematic visual representation

**Style:** ${style}, podcast cover art, professional, modern

Generate ONLY the image, no text or explanations.`;
  }

  /**
   * Detect MIME type from buffer
   */
  private detectMimeType(buffer: Buffer): string {
    // Check magic numbers
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }

    // Default to JPEG
    return 'image/jpeg';
  }
}

/**
 * Create a podcast image enhancer with the specified API key
 */
export function createPodcastImageEnhancer(apiKey: string): PodcastImageEnhancer {
  return new PodcastImageEnhancer(apiKey);
}
