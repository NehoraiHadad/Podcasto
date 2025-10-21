/**
 * Multi-variation enhancement for podcast images
 * Generates multiple AI variations in parallel for A/B testing
 */

import type { EnhancementOptions, EnhancementResult, SingleVariation, ImageAnalysis } from './podcast-image-enhancer';
import { detectImageMimeType, createEnhancementPrompt } from './podcast-image-utils';
import { trackCostEvent } from './cost-tracker';

/**
 * Generate multiple variations of an enhanced image in parallel
 * This is separated to keep the main enhancer clean
 *
 * @param apiKey - Gemini API key
 * @param sourceImageBuffer - The original image buffer
 * @param options - Enhancement options
 * @param count - Number of variations to generate
 * @param analysis - Optional AI analysis of the source image
 * @returns Enhancement result with multiple variations
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
    const mimeType = detectImageMimeType(sourceImageBuffer);

    // Use AI-generated prompt if available, otherwise use shared utility
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
        index,
        options.episodeId,
        options.podcastId,
        options.userId
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
 * Generate a single variation using Gemini 2.5 Flash Image
 *
 * @param apiKey - Gemini API key
 * @param base64Image - Base64-encoded source image
 * @param mimeType - MIME type of the source image
 * @param prompt - Enhancement prompt
 * @param options - Enhancement options
 * @param index - Variation index (used for temperature adjustment)
 * @param episodeId - Optional episode ID for cost tracking
 * @param podcastId - Optional podcast ID for cost tracking
 * @param userId - Optional user ID for cost tracking
 * @returns Single variation or null if generation fails
 */
async function generateSingleVariation(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  prompt: string,
  options: EnhancementOptions,
  index: number,
  episodeId?: string,
  podcastId?: string,
  userId?: string
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

    // Track cost for this variation
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        userId,
        eventType: 'ai_api_call',
        service: 'gemini_image',
        quantity: 1,
        unit: 'images',
        metadata: {
          model: 'gemini-2.5-flash-image',
          operation: 'enhanceImageVariation',
          variation_index: index,
          temperature
        }
      });
    } catch (costError) {
      console.error(`[PODCAST_ENHANCER_MULTI] Cost tracking failed for variation ${index + 1}:`, costError);
    }

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
