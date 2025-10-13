/**
 * Shared utilities for podcast image enhancement
 * Provides MIME detection and prompt generation for AI image processing
 */

import type { ImageAnalysis, EnhancementOptions } from './podcast-image-enhancer';

/**
 * Detect MIME type from buffer magic numbers
 * Supports JPEG, PNG, GIF, and WebP formats
 *
 * @param buffer - The image buffer to analyze
 * @returns The detected MIME type (defaults to 'image/jpeg' if unknown)
 */
export function detectImageMimeType(buffer: Buffer): string {
  // JPEG magic numbers
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG magic numbers
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // GIF magic numbers
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }

  // WebP magic numbers
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp';
  }

  // Default to JPEG if format cannot be determined
  return 'image/jpeg';
}

/**
 * Create enhancement prompt based on podcast metadata and image analysis
 * Generates narrative prompts that preserve existing elements while enhancing aesthetics
 *
 * @param options - Podcast enhancement options (title, style)
 * @param analysis - Optional AI analysis of the source image
 * @returns A detailed prompt for image enhancement
 */
export function createEnhancementPrompt(
  options: EnhancementOptions,
  analysis: ImageAnalysis | null
): string {
  const style = options.podcastStyle || 'modern, professional';

  if (analysis) {
    // Narrative, scene-based prompt with analysis
    return `Transform this source image into a stunning professional podcast cover for "${options.podcastTitle}".

CURRENT IMAGE CONTAINS: ${analysis.description} The scene features ${analysis.colors} tones with a ${analysis.style} aesthetic, creating a ${analysis.mood} atmosphere. The key visual elements are: ${analysis.mainElements}.

TRANSFORMATION VISION:
Enhance this image with cinematic, professional podcast aesthetics while PRESERVING THE CORE IDENTITY AND ALL EXISTING ELEMENTS. Envision the image bathed in enhanced ${analysis.colors} lighting—make these colors pop with dramatic saturation and vibrancy that catches the eye immediately. The original ${analysis.mainElements} should remain EXACTLY as they are but elevated to a ${style} visual style.

Amplify the ${analysis.mood} feeling but polish it with professional-grade post-processing. Add depth through sophisticated lighting techniques—perhaps rim lighting on key elements, subtle vignetting, or atmospheric haze that adds dimension. The composition should be optimized for square podcast cover format, ensuring it reads beautifully even as a small thumbnail.

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
 * Create from-scratch prompt for text-only generation
 * Used when no source image is available
 *
 * @param options - Podcast enhancement options (title, style)
 * @returns A prompt for generating a new podcast cover from scratch
 */
export function createFromScratchPrompt(options: EnhancementOptions): string {
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
