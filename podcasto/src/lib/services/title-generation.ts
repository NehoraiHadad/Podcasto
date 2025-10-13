import { AIService } from '../ai';
import { TitleGenerationOptions } from '../ai/types';

/**
 * Service for generating episode titles using AI
 *
 * This service is responsible for generating engaging, accurate titles
 * for podcast episodes based on their transcript content. It delegates
 * to the AIService for the actual generation logic.
 */
export class TitleGenerationService {
  private aiService: AIService;

  /**
   * Create a new title generation service
   *
   * @param aiService - The AI service to use for title generation
   */
  constructor(aiService: AIService) {
    if (!aiService) {
      throw new Error('AIService is required for TitleGenerationService');
    }
    this.aiService = aiService;
  }

  /**
   * Generate a title for an episode based on its transcript
   *
   * @param transcript - The full transcript of the episode
   * @param options - Configuration options for title generation
   * @returns A generated title string
   *
   * @example
   * ```typescript
   * const service = new TitleGenerationService(aiService);
   * const title = await service.generateTitle(
   *   transcript,
   *   { language: 'English', style: 'engaging', maxLength: 60 }
   * );
   * ```
   */
  async generateTitle(
    transcript: string,
    options: TitleGenerationOptions
  ): Promise<string> {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript cannot be empty');
    }

    console.log(`[TITLE_GENERATION] Generating title in ${options.language || 'default language'}`);

    try {
      // Use the AI service to generate both title and summary
      // We only return the title, but the AI service generates both together for efficiency
      const result = await this.aiService.generateTitleAndSummary(
        transcript,
        options,
        // Provide minimal summary options since we're discarding the summary
        { language: options.language, style: 'concise', maxLength: 150 }
      );

      return result.title;
    } catch (error) {
      console.error(`[TITLE_GENERATION] Error generating title:`, error);
      throw new Error(
        `Failed to generate title: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Factory function to create a TitleGenerationService
 *
 * @param config - Configuration object containing the AI service
 * @returns A new TitleGenerationService instance
 */
export function createTitleGenerationService(config: {
  aiService: AIService;
}): TitleGenerationService {
  if (!config.aiService) {
    throw new Error('aiService is required');
  }

  return new TitleGenerationService(config.aiService);
}
