import {
  AIProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
  TitleGenerationOptions,
  SummaryGenerationOptions,
  TitleSummaryResult
} from '../types';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../utils/retry';
import { ImageGenerator } from './image-generator';
import { GeminiTextGenerator } from './gemini-text-generation';
import { listGeminiModels } from './gemini-model-utils';
import { trackCostEvent } from '@/lib/services/cost-tracker';

/**
 * Configuration for the Gemini provider
 */
export interface GeminiConfig {
  apiKey: string;
  modelName?: string;
  baseUrl?: string;
}

/**
 * Schema for title and summary generation response
 */
const titleSummarySchema = {
  type: "object" as const,
  properties: {
    title: {
      type: "string" as const,
      description: "A concise, engaging title for the podcast episode"
    },
    summary: {
      type: "string" as const,
      description: "A comprehensive summary of the podcast episode content"
    }
  },
  required: ["title", "summary"],
  propertyOrdering: ["title", "summary"]
};

/**
 * Gemini AI provider implementation
 */
export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private baseUrl?: string;
  private textModel: string;
  private imageGenerator: ImageGenerator;
  private textGenerator: GeminiTextGenerator;
  private retryConfig: RetryConfig;

  /**
   * Initialize the Gemini provider
   */
  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    
    // Default to Gemini 2.0 Flash for text
    this.textModel = config.modelName || 'gemini-2.0-flash';
    this.imageGenerator = new ImageGenerator(config.apiKey);
    this.textGenerator = new GeminiTextGenerator(config.apiKey, this.textModel);
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    
    console.log(`[GEMINI_PROVIDER] Using model: text=${this.textModel}`);
  }

  /**
   * Generate a title and summary based on transcript text
   */
  async generateTitleAndSummary(
    transcript: string,
    titleOptions?: TitleGenerationOptions,
    summaryOptions?: SummaryGenerationOptions,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<TitleSummaryResult> {
    try {
      return await withRetry(async () => {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        const prompt = this.buildTitleSummaryPrompt(transcript, titleOptions, summaryOptions);

        const response = await ai.models.generateContent({
          model: this.textModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: titleSummarySchema,
            temperature: 0.7,
            maxOutputTokens: 500
          }
        });

        // Track cost using usageMetadata
        try {
          if (response.usageMetadata) {
            await trackCostEvent({
              episodeId,
              podcastId,
              userId,
              eventType: 'ai_api_call',
              service: 'gemini_text',
              quantity: response.usageMetadata.totalTokenCount || 0,
              unit: 'tokens',
              metadata: {
                model: this.textModel,
                operation: 'generateTitleAndSummary',
                input_tokens: response.usageMetadata.promptTokenCount || 0,
                output_tokens: response.usageMetadata.candidatesTokenCount || 0
              }
            });
          }
        } catch (costError) {
          console.error('[GEMINI_PROVIDER] Cost tracking failed for generateTitleAndSummary:', costError);
        }

        // The SDK now automatically parses the structured response
        const parsedResponse = JSON.parse(response.text || '{}');

        return {
          title: parsedResponse.title || 'Untitled Episode',
          summary: parsedResponse.summary || 'No summary available.'
        };
      }, this.retryConfig);
    } catch (error) {
      console.error('[GEMINI_PROVIDER] Error generating title and summary:', error);
      return {
        title: 'Untitled Episode',
        summary: 'Error occurred while generating summary.'
      };
    }
  }

  /**
   * Generate an image based on a description
   */
  async generateImage(
    description: string,
    options?: ImageGenerationOptions,
    episodeId?: string,
    podcastId?: string,
    userId?: string
  ): Promise<ImageGenerationResult> {
    // Delegate to the specialized image generator
    return this.imageGenerator.generateImage(description, options, episodeId, podcastId, userId);
  }

  /**
   * List available models from the Gemini API
   */
  async listAvailableModels(): Promise<string[]> {
    return listGeminiModels(this.apiKey);
  }

  /**
   * Generate text from a prompt
   */
  async generateText(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    modelName?: string;
    episodeId?: string;
    podcastId?: string;
    userId?: string;
  }): Promise<string> {
    return this.textGenerator.generateText(prompt, options);
  }

  private buildTitleSummaryPrompt(
    transcript: string,
    titleOptions?: TitleGenerationOptions,
    summaryOptions?: SummaryGenerationOptions
  ): string {
    // Set up style based on options
    const titleStyle = titleOptions?.style || 'engaging';
    const summaryStyle = summaryOptions?.style || 'concise';
    const language = titleOptions?.language || summaryOptions?.language || 'English';
    
    // Limit transcript length to avoid token limits
    const truncatedTranscript = transcript.length > 12000 
      ? transcript.substring(0, 12000) + "..." 
      : transcript;

    // Create a prompt for title and summary generation
    return `
      You are a professional podcast editor who creates engaging titles and summaries.
      
      I have a podcast transcript, and I need you to:
      1. Create a ${titleStyle} title (maximum ${titleOptions?.maxLength || 60} characters)
      2. Write a ${summaryStyle} summary (maximum ${summaryOptions?.maxLength || 150} words)
      
      The title and summary should be in ${language}.
      
      Respond in JSON format with "title" and "summary" fields only.
      
      Here is the transcript:
      --------
      ${truncatedTranscript}
      --------
    `;
  }
} 