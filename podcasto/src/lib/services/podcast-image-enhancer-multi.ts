/**
 * Multi-variation enhancement for podcast images
 * Generates multiple AI variations in parallel for A/B testing
 */

import { EnhancementOptions, EnhancementResult, SingleVariation, ImageAnalysis } from './podcast-image-enhancer';

/**
 * Generate multiple variations of an enhanced image in parallel
 * This is separated to keep the main enhancer clean
 */
export async function enhanceImageMultiple(
  apiKey: string,
  sourceImageBuffer: Buffer,
  options: EnhancementOptions,
  count: number,
  analysis: ImageAnalysis | null
): Promise<EnhancementResult> {
  try {
    console.log(`[PODCAST_ENHANCER_MULTI] Generating ${count} variations for: ${options.podcastTitle}`);

    // Convert buffer to base64 once
    const base64Image = sourceImageBuffer.toString('base64');
    const mimeType = detectMimeType(sourceImageBuffer);

    // Create enhancement prompt
    const enhancementPrompt = createEnhancementPrompt(options, analysis);

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
      prompt: enhancementPrompt,
      analysis: analysis || undefined
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
 * Create enhancement prompt based on podcast metadata and image analysis
 */
function createEnhancementPrompt(options: EnhancementOptions, analysis: ImageAnalysis | null): string {
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

**Creative Enhancement Instructions:**
1. PRESERVE the core identity: Keep the main elements (${analysis.mainElements}) and overall composition recognizable
2. ENHANCE dramatically: Make the ${analysis.colors} color palette more vibrant, saturated, and eye-catching
3. TRANSFORM the style: Evolve from ${analysis.style} into a ${style} aesthetic
4. AMPLIFY the mood: Enhance the ${analysis.mood} feeling while making it more polished and professional
5. OPTIMIZE for podcast: Square format, clean composition suitable for small thumbnails
6. CREATIVE FREEDOM: You may add subtle podcast-related elements (like stylized sound waves, abstract audio patterns, or atmospheric effects) ONLY if they enhance the design without overwhelming the original content
7. NO TEXT: Do not add titles, names, or any lettering whatsoever
8. FOCUS: Create a visually stunning, memorable cover that stands out in podcast listings

Generate ONLY the enhanced image, no text or explanations.`;
  } else {
    // Fallback to generic prompt if no analysis
    prompt += `
**Creative Enhancement Instructions:**
1. PRESERVE the source: Keep the main visual elements and color scheme recognizable
2. ENHANCE dramatically: Make colors more vibrant, saturated, and professional
3. OPTIMIZE for podcast: Square format, clean composition, suitable for thumbnails
4. ADD podcast aesthetic: Apply the ${style} style while maintaining the source's character
5. CREATIVE FREEDOM: You may add subtle podcast-related enhancements (stylized audio patterns, atmospheric effects, depth) ONLY if they improve the design
6. NO TEXT: Do not add titles, names, or any lettering
7. BALANCE: The result should feel enhanced but still connected to the original
8. FOCUS: Create a visually striking cover that stands out in podcast platforms

Generate ONLY the enhanced image, no text or explanations.`;
  }

  return prompt;
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
