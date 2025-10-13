/**
 * Service for AI-based image analysis
 * Analyzes podcast images to create targeted enhancement prompts
 */

import type { ImageAnalysis } from './podcast-image-enhancer';
import { detectImageMimeType } from './podcast-image-utils';

/**
 * Service for analyzing images with AI to understand content and generate enhancement prompts
 */
export class PodcastImageAnalyzer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze source image to understand its content and generate a custom enhancement prompt
   * Uses Gemini 2.5 Flash for multimodal analysis with structured JSON output
   *
   * @param sourceImageBuffer - The image buffer to analyze
   * @param podcastStyle - The desired podcast style for the enhancement
   * @returns Image analysis with AI-generated enhancement prompt, or null if analysis fails
   */
  async analyzeImage(
    sourceImageBuffer: Buffer,
    podcastStyle: string = 'modern, professional'
  ): Promise<ImageAnalysis | null> {
    try {
      console.log('[PODCAST_ANALYZER] Analyzing source image...');

      const base64Image = sourceImageBuffer.toString('base64');
      const mimeType = detectImageMimeType(sourceImageBuffer);

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const analysisPrompt = `You are a professional podcast cover designer. Analyze this image and create a custom prompt for transforming it into a stunning podcast cover.

**Part 1: Image Analysis**
Analyze the image and provide:
1. **Description**: What is shown in the image? (2-3 sentences)
2. **Colors**: Dominant colors and color scheme
3. **Style**: Visual style (e.g., minimalist, vibrant, professional, artistic)
4. **Main Elements**: Key visual elements or subjects
5. **Mood**: Mood or feeling it conveys

**Part 2: Generate Transformation Prompt**
Based on your analysis, create a UNIQUE, CREATIVE prompt for transforming this specific image into a professional podcast cover. The prompt should:
- Be narrative and descriptive (not bullet points)
- Reference specific elements you identified in the image (colors, subjects, mood)
- Suggest creative enhancements that fit THIS PARTICULAR IMAGE
- Include photographic techniques (lighting, composition, color grading)
- Be different each time - adapt to what you see in THIS specific image
- Target the podcast style: ${podcastStyle}
- Be written as instructions to an image AI (e.g., "Transform this image by...", "Enhance the...", etc.)

**CRITICAL PRESERVATION RULES:**
- PRESERVE ALL EXISTING TEXT in the source image exactly as it appears (logos, channel names, Hebrew/English text, etc.)
- PRESERVE the core identity and recognizable elements of the source image
- DO NOT remove, hide, or modify any text that exists in the original
- DO NOT add new text or lettering
- DO NOT add podcast elements (microphones, headphones, sound waves, audio icons)
- ONLY enhance: colors, lighting, effects, atmosphere, professional polish
- The goal is ENHANCEMENT, not replacement - keep what makes this image unique

Think of this as "polishing" the original, not creating something new. If there's a logo with text, keep it. If there's a channel name, keep it. Just make everything look more professional and podcast-ready without adding any new elements.

Make the prompt highly personalized to THIS image's unique content, not generic.

Format your response as JSON with these exact keys: description, colors, style, mainElements, mood, generationPrompt`;

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
          },
          generationPrompt: {
            type: 'string',
            description: 'Detailed narrative prompt for transforming this specific image into a podcast cover'
          }
        },
        required: ['description', 'colors', 'style', 'mainElements', 'mood', 'generationPrompt']
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
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        console.warn('[PODCAST_ANALYZER] No analysis text in response');
        console.warn('[PODCAST_ANALYZER] Full response:', JSON.stringify(response, null, 2));
        return null;
      }

      const analysisText = candidate.content.parts[0].text;
      console.log('[PODCAST_ANALYZER] Raw analysis text:', analysisText);

      const analysis = JSON.parse(analysisText) as ImageAnalysis;

      console.log('[PODCAST_ANALYZER] Analysis completed:', JSON.stringify(analysis, null, 2));
      return analysis;

    } catch (error) {
      console.error('[PODCAST_ANALYZER] Error analyzing image:', error);
      if (error instanceof Error) {
        console.error('[PODCAST_ANALYZER] Error details:', error.message);
        console.error('[PODCAST_ANALYZER] Stack:', error.stack);
      }
      return null;
    }
  }
}

/**
 * Factory function to create a podcast image analyzer
 *
 * @param apiKey - Gemini API key
 * @returns Configured PodcastImageAnalyzer instance
 */
export function createPodcastImageAnalyzer(apiKey: string): PodcastImageAnalyzer {
  return new PodcastImageAnalyzer(apiKey);
}
