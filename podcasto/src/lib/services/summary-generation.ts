import { AIService } from '../ai';
import { SummaryGenerationOptions } from '../ai/types';
import type { ISummaryGenerationService } from './interfaces';

/**
 * Service for generating episode summaries using AI
 *
 * This service is responsible for generating concise, informative summaries
 * for podcast episodes based on their transcript content. It delegates
 * to the AIService for the actual generation logic.
 */
export class SummaryGenerationService implements ISummaryGenerationService {
  private aiService: AIService;

  /**
   * Create a new summary generation service with dependency injection
   *
   * @param aiService - The AI service to use for summary generation
   */
  constructor(aiService: AIService) {
    if (!aiService) {
      throw new Error('AIService is required for SummaryGenerationService');
    }
    this.aiService = aiService;
  }

  /**
   * Generate a summary for an episode based on its transcript
   *
   * @param transcript - The full transcript of the episode
   * @param options - Configuration options for summary generation
   * @returns A generated summary string
   *
   * @example
   * ```typescript
   * const service = new SummaryGenerationService(aiService);
   * const summary = await service.generateSummary(
   *   transcript,
   *   { language: 'English', style: 'concise', maxLength: 150 }
   * );
   * ```
   */
  async generateSummary(
    transcript: string,
    options: SummaryGenerationOptions
  ): Promise<string> {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript cannot be empty');
    }

    console.log(`[SUMMARY_GENERATION] Generating summary in ${options.language || 'default language'}`);

    try {
      // Use the AI service to generate both title and summary
      // We only return the summary, but the AI service generates both together for efficiency
      const result = await this.aiService.generateTitleAndSummary(
        transcript,
        // Provide minimal title options since we're discarding the title
        { language: options.language, style: 'engaging', maxLength: 60 },
        options
      );

      return result.summary;
    } catch (error) {
      console.error(`[SUMMARY_GENERATION] Error generating summary:`, error);
      throw new Error(
        `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Factory function to create a SummaryGenerationService
 *
 * @param aiService - The AI service instance to inject
 * @returns ISummaryGenerationService interface implementation
 */
export function createSummaryGenerationService(
  aiService: AIService
): ISummaryGenerationService {
  if (!aiService) {
    throw new Error('aiService is required');
  }

  return new SummaryGenerationService(aiService);
}
