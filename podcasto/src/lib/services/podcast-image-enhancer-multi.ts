/**
 * Multi-variation enhancement for podcast images
 * Generates multiple AI variations in parallel for A/B testing
 */

import { EnhancementOptions, EnhancementResult, SingleVariation } from './podcast-image-enhancer';

/**
 * Generate multiple variations of an enhanced image in parallel
 * This is separated to keep the main enhancer clean
 */
export async function enhanceImageMultiple(
  apiKey: string,
  sourceImageBuffer: Buffer,
  options: EnhancementOptions,
  count: number
): Promise<EnhancementResult> {
  try {
    console.log(`[PODCAST_ENHANCER_MULTI] Generating ${count} variations for: ${options.podcastTitle}`);

    // Convert buffer to base64 once
    const base64Image = sourceImageBuffer.toString('base64');
    const mimeType = detectMimeType(sourceImageBuffer);

    // Create enhancement prompt
    const enhancementPrompt = createEnhancementPrompt(options);

    // Generate multiple variations in parallel
    const variationPromises = Array.from({ length: count }, (_, index) =>
      generateSingleVariation(
        apiKey,
        base64Image,
        mimeType,
        enhancementPrompt,
        options,
        index
      )
    );

    const results = await Promise.allSettled(variationPromises);

    // Collect successful variations
    const successfulVariations: SingleVariation[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successfulVariations.push(result.value);
      } else if (result.status === 'rejected') {
        errors.push(`Variation ${index + 1}: ${result.reason}`);
        console.error(`[PODCAST_ENHANCER_MULTI] Variation ${index + 1} failed:`, result.reason);
      }
    });

    if (successfulVariations.length === 0) {
      return {
        success: false,
        mimeType: 'image/jpeg',
        error: `Failed to generate any variations: ${errors.join('; ')}`
      };
    }

    console.log(`[PODCAST_ENHANCER_MULTI] Successfully generated ${successfulVariations.length}/${count} variations`);

    return {
      success: true,
      variations: successfulVariations,
      enhancedImageData: successfulVariations[0].imageData, // First one for backward compatibility
      mimeType: successfulVariations[0].mimeType,
      prompt: enhancementPrompt
    };

  } catch (error) {
    console.error('[PODCAST_ENHANCER_MULTI] Error generating multiple variations:', error);
    return {
      success: false,
      mimeType: 'image/jpeg',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a single variation
 */
async function generateSingleVariation(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  prompt: string,
  options: EnhancementOptions,
  index: number
): Promise<SingleVariation | null> {
  try {
    console.log(`[PODCAST_ENHANCER_MULTI] Generating variation ${index + 1}...`);

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    // Add slight variation to temperature for diversity
    const temperature = 0.9 + (index * 0.05); // 0.9, 0.95, 1.0

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ['Image'] // Only image output
      }
    });

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    for (const candidate of candidates) {
      if (!candidate.content?.parts) continue;

      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          const outputMimeType = part.inlineData.mimeType || 'image/jpeg';

          console.log(`[PODCAST_ENHANCER_MULTI] Variation ${index + 1} generated: ${imageData.length} bytes`);

          return {
            imageData,
            mimeType: outputMimeType,
            variationIndex: index
          };
        }
      }
    }

    throw new Error('No image data in response');

  } catch (error) {
    console.error(`[PODCAST_ENHANCER_MULTI] Error generating variation ${index + 1}:`, error);
    throw error;
  }
}

/**
 * Create enhancement prompt based on podcast metadata
 */
function createEnhancementPrompt(options: EnhancementOptions): string {
  const style = options.podcastStyle || 'modern, professional';

  return `Transform this image into a professional podcast cover art.

**Podcast Title:** ${options.podcastTitle}

**Requirements:**
1. Keep the main visual elements and color scheme from the source image
2. Make it suitable for a podcast cover (square format, clean composition)
3. Enhance the colors to be more vibrant and eye-catching
4. Add subtle podcast-appropriate styling (${style} aesthetic)
5. Maintain brand consistency with the source image
6. DO NOT add text, titles, or any lettering
7. DO NOT include podcast symbols (microphones, headphones)
8. Focus on creating a visually striking, professional result

**Style:** ${style}, podcast cover art, professional, eye-catching

Generate ONLY the enhanced image, no text or explanations.`;
}

/**
 * Detect MIME type from buffer
 */
function detectMimeType(buffer: Buffer): string {
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
  return 'image/jpeg';
}
