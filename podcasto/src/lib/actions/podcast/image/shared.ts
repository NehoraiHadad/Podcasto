/**
 * Shared utilities for podcast image processing.
 * Contains common logic used across multiple image actions.
 */

import { createPodcastImageEnhancer, type ImageAnalysis } from '@/lib/services/podcast-image-enhancer';
import type { ImageActionResult, ImageGenerationOptions } from './types';

/**
 * Shared function to enhance image with AI (WITHOUT uploading to S3).
 * Used by all image generation sources.
 * Images are only uploaded when the user saves the form.
 *
 * @param imageBuffer - The source image buffer to enhance
 * @param podcastTitle - Title of the podcast (used for AI context)
 * @param options - Generation options (style, variations)
 * @returns Result containing base64 image data (not uploaded to S3 yet)
 */
export async function enhanceImageWithAI(
  imageBuffer: Buffer,
  podcastTitle: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  let finalImageBuffer = imageBuffer;
  let enhancedWithAI = false;
  let analysis: ImageAnalysis | undefined;
  let prompt: string | undefined;

  // Store original image as base64 for preview (NOT uploaded to S3)
  const originalImageData = imageBuffer.toString('base64');

  // Try to enhance with AI if Gemini API key is available
  if (process.env.GEMINI_API_KEY) {
    const variationsCount = options?.variationsCount || 1;
    console.log(`[IMAGE_SHARED] Enhancing image with AI (${variationsCount} variation${variationsCount > 1 ? 's' : ''})`);

    try {
      const enhancer = createPodcastImageEnhancer(process.env.GEMINI_API_KEY);
      const enhancementResult = await enhancer.enhanceImage(
        imageBuffer,
        {
          podcastTitle,
          podcastStyle: options?.style || 'modern, professional',
          aspectRatio: '1:1',
          variationsCount
        }
      );

      if (enhancementResult.success && enhancementResult.variations && enhancementResult.variations.length > 0) {
        console.log(`[IMAGE_SHARED] AI enhancement successful - ${enhancementResult.variations.length} variation(s) generated`);

        // Store analysis and prompt for return
        analysis = enhancementResult.analysis;
        prompt = enhancementResult.prompt;

        // Handle multiple variations - return as base64 (NO S3 upload)
        if (variationsCount > 1 && enhancementResult.variations.length > 1) {
          // Convert all variations to base64
          const allVariationBase64s = enhancementResult.variations.map(variation =>
            variation.imageData.toString('base64')
          );

          console.log(`[IMAGE_SHARED] Generated ${allVariationBase64s.length} variations (stored as base64, will upload to S3 when form is saved)`);

          return {
            success: true,
            imageDatas: allVariationBase64s,
            mimeType: enhancementResult.variations[0].mimeType,
            enhancedWithAI: true,
            analysis,
            prompt,
            originalImageData
          };
        } else {
          // Single variation
          finalImageBuffer = enhancementResult.variations[0].imageData;
          enhancedWithAI = true;
        }
      } else {
        console.warn(`[IMAGE_SHARED] AI enhancement failed, using original: ${enhancementResult.error}`);
      }
    } catch (error) {
      console.error(`[IMAGE_SHARED] Error during AI enhancement:`, error);
      console.log(`[IMAGE_SHARED] Falling back to original image`);
    }
  } else {
    console.log(`[IMAGE_SHARED] GEMINI_API_KEY not found, skipping AI enhancement`);
  }

  // Return base64 data (NO S3 upload until form is saved)
  const finalImageBase64 = finalImageBuffer.toString('base64');

  console.log(`[IMAGE_SHARED] Image generated as base64 (${finalImageBase64.length} chars, AI enhanced: ${enhancedWithAI})`);
  console.log(`[IMAGE_SHARED] Will upload to S3 only when user saves the form`);

  return {
    success: true,
    imageData: finalImageBase64,
    mimeType: 'image/jpeg',
    enhancedWithAI,
    analysis,
    prompt,
    originalImageData
  };
}
