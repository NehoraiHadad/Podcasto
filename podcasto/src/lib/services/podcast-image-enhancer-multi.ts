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

    // Use AI-generated prompt if available, otherwise fall back to hardcoded prompt
    const enhancementPrompt = analysis?.generationPrompt
      ? analysis.generationPrompt
      : createEnhancementPrompt(options, analysis);

    console.log(`[PODCAST_ENHANCER_MULTI] Using ${analysis?.generationPrompt ? 'AI-generated' : 'hardcoded'} prompt`);

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

  if (analysis) {
    // Narrative, scene-based prompt with analysis
    return `Transform this source image into a stunning professional podcast cover for "${options.podcastTitle}".

CURRENT IMAGE CONTAINS: ${analysis.description} The scene features ${analysis.colors} tones with a ${analysis.style} aesthetic, creating a ${analysis.mood} atmosphere. The key visual elements are: ${analysis.mainElements}.

TRANSFORMATION VISION:
Enhance this image with cinematic, professional podcast aesthetics while PRESERVING THE CORE IDENTITY AND ALL EXISTING ELEMENTS. Envision the image bathed in enhanced ${analysis.colors} lighting—make these colors pop with dramatic saturation and vibrancy that catches the eye immediately. The original ${analysis.mainElements} should remain EXACTLY as they are but elevated to a ${style} visual style.

Amplify the ${analysis.mood} feeling but polish it with professional-grade post-processing. Add depth through sophisticated lighting techniques—perhaps rim lighting on key elements, subtle vignetting, or atmospheric haze that adds dimension. The composition should be optimized for square podcast cover format, ensuring it reads beautifully even as a small thumbnail.

Consider adding subtle, tasteful podcast elements if they enhance rather than distract: perhaps abstract sound wave patterns integrated into the background, soft audio frequency visualizations as atmospheric effects, or a gentle depth-of-field blur that draws focus to the main subject.

CRITICAL PRESERVATION RULES:
- PRESERVE ALL EXISTING TEXT exactly as it appears (logos, channel names, Hebrew/English text, etc.)
- PRESERVE all recognizable elements and the core identity of the source image
- DO NOT remove, hide, or modify any text that exists in the original image
- DO NOT add new text or lettering
- ONLY enhance: colors, lighting, effects, atmosphere, professional polish
- This is ENHANCEMENT, not recreation - polish what exists, don't replace it
- Use photographic language: think about camera angle, lighting quality, color grading
- The result should feel premium, polished, and professionally produced

Generate a visually stunning podcast cover that makes listeners want to click and listen.`;
  } else {
    // Fallback narrative prompt without analysis
    return `Transform this source image into a stunning professional podcast cover for "${options.podcastTitle}".

TRANSFORMATION VISION:
Enhance this image with cinematic ${style} aesthetics while PRESERVING ALL EXISTING ELEMENTS that make the original image special. Envision the composition bathed in dramatic lighting that makes colors pop with vibrant saturation and professional-grade color grading. Every visual element should be elevated with enhanced depth, clarity, and visual impact - but kept intact.

Apply sophisticated post-processing techniques: enhance contrast for visual punch, add subtle atmospheric effects for depth, optimize the composition for square podcast cover format. The image should read beautifully even as a small thumbnail—clear focal points, strong visual hierarchy, eye-catching appeal.

Consider tastefully integrating podcast elements if they enhance the design: abstract sound wave patterns woven into the background, soft audio frequency visualizations as atmospheric effects, or depth-of-field blur that emphasizes the main subject. These should feel natural and elevate the design, never distract or overwhelm.

Use photographic language in your approach: think cinematic camera angles, professional studio lighting quality, film-grade color grading. The aesthetic should be ${style} while maintaining complete connection to the source material.

CRITICAL PRESERVATION RULES:
- PRESERVE ALL EXISTING TEXT exactly as it appears (logos, channel names, Hebrew/English text, etc.)
- PRESERVE all recognizable elements and the core identity of the source image
- DO NOT remove, hide, or modify any text or logos that exist in the original
- DO NOT add new text or lettering
- ONLY enhance: colors, lighting, effects, atmosphere, professional polish
- This is ENHANCEMENT, not recreation - polish what exists, don't replace it
- Keep the original essence fully recognizable but dramatically improved
- Create a premium, polished, professionally produced look
- Optimize for thumbnail visibility and immediate visual impact

Generate a podcast cover that stops scrollers and makes them want to listen.`;
  }
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
