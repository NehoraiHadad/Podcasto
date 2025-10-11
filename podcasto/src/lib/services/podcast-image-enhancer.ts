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

      // Define the JSON schema for structured output
      const responseSchema = {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'What is shown in the image (2-3 sentences)'
          },
          colors: {
            type: 'string',
            description: 'Dominant colors and color scheme'
          },
          style: {
            type: 'string',
            description: 'Visual style (e.g., minimalist, vibrant, professional, artistic)'
          },
          mainElements: {
            type: 'string',
            description: 'Key visual elements or subjects'
          },
          mood: {
            type: 'string',
            description: 'Mood or feeling the image conveys'
          }
        },
        required: ['description', 'colors', 'style', 'mainElements', 'mood']
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        console.warn('[PODCAST_ENHANCER] No analysis text in response');
        console.warn('[PODCAST_ENHANCER] Full response:', JSON.stringify(response, null, 2));
        return null;
      }

      const analysisText = candidate.content.parts[0].text;
      console.log('[PODCAST_ENHANCER] Raw analysis text:', analysisText);

      const analysis = JSON.parse(analysisText) as ImageAnalysis;

      console.log('[PODCAST_ENHANCER] Analysis completed:', JSON.stringify(analysis, null, 2));
      return analysis;

    } catch (error) {
      console.error('[PODCAST_ENHANCER] Error analyzing image:', error);
      if (error instanceof Error) {
        console.error('[PODCAST_ENHANCER] Error details:', error.message);
        console.error('[PODCAST_ENHANCER] Stack:', error.stack);
      }
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

    if (analysis) {
      // Narrative, scene-based prompt with analysis
      return `Transform this source image into a stunning professional podcast cover for "${options.podcastTitle}".

CURRENT IMAGE CONTAINS: ${analysis.description} The scene features ${analysis.colors} tones with a ${analysis.style} aesthetic, creating a ${analysis.mood} atmosphere. The key visual elements are: ${analysis.mainElements}.

TRANSFORMATION VISION:
Reimagine this scene with cinematic, professional podcast aesthetics while preserving the core identity. Envision the image bathed in enhanced ${analysis.colors} lighting—make these colors pop with dramatic saturation and vibrancy that catches the eye immediately. The original ${analysis.mainElements} should remain clearly recognizable but elevated to a ${style} visual style.

Amplify the ${analysis.mood} feeling but polish it with professional-grade post-processing. Add depth through sophisticated lighting techniques—perhaps rim lighting on key elements, subtle vignetting, or atmospheric haze that adds dimension. The composition should be optimized for square podcast cover format, ensuring it reads beautifully even as a small thumbnail.

Consider adding subtle, tasteful podcast elements if they enhance rather than distract: perhaps abstract sound wave patterns integrated into the background, soft audio frequency visualizations as atmospheric effects, or a gentle depth-of-field blur that draws focus to the main subject.

CRITICAL RULES:
- Never add text, titles, names, or any lettering
- Keep the original scene recognizable but dramatically improved
- Use photographic language: think about camera angle, lighting quality, color grading
- The result should feel premium, polished, and professionally produced

Generate a visually stunning podcast cover that makes listeners want to click and listen.`;
    } else {
      // Fallback narrative prompt without analysis
      return `Transform this source image into a stunning professional podcast cover for "${options.podcastTitle}".

TRANSFORMATION VISION:
Reimagine this scene with cinematic ${style} aesthetics while preserving what makes the original image special. Envision the composition bathed in dramatic lighting that makes colors pop with vibrant saturation and professional-grade color grading. Every visual element should be elevated with enhanced depth, clarity, and visual impact.

Apply sophisticated post-processing techniques: enhance contrast for visual punch, add subtle atmospheric effects for depth, optimize the composition for square podcast cover format. The image should read beautifully even as a small thumbnail—clear focal points, strong visual hierarchy, eye-catching appeal.

Consider tastefully integrating podcast elements if they enhance the design: abstract sound wave patterns woven into the background, soft audio frequency visualizations as atmospheric effects, or depth-of-field blur that emphasizes the main subject. These should feel natural and elevate the design, never distract or overwhelm.

Use photographic language in your approach: think cinematic camera angles, professional studio lighting quality, film-grade color grading. The aesthetic should be ${style} while maintaining connection to the source material.

CRITICAL RULES:
- Never add text, titles, names, or any lettering
- Keep the original essence recognizable but dramatically improved
- Create a premium, polished, professionally produced look
- Optimize for thumbnail visibility and immediate visual impact

Generate a podcast cover that stops scrollers and makes them want to listen.`;
    }
  }

  /**
   * Create from-scratch prompt for text-only generation
   */
  private createFromScratchPrompt(options: EnhancementOptions): string {
    const style = options.podcastStyle || 'modern, professional';

    return `Create a professional podcast cover art for a podcast titled "${options.podcastTitle}".

**Creative Requirements:**
- ${style} aesthetic
- Visually striking and professional
- Suitable for podcast platforms (square format, optimized for thumbnails)
- Rich, vibrant colors
- Interesting composition
- CREATIVE FREEDOM: May include subtle podcast elements (stylized sound waves, abstract audio patterns, atmospheric effects) if they enhance the design
- NO TEXT: Do not include ANY text, titles, or lettering
- Focus on abstract or thematic visual representation that captures the podcast's essence

**Style:** ${style}, podcast cover art, professional, modern, eye-catching

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
