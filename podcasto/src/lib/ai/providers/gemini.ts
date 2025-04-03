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

/**
 * Configuration for the Gemini provider
 */
export interface GeminiConfig {
  apiKey: string;
  modelName?: string;
  baseUrl?: string;
}

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
    summaryOptions?: SummaryGenerationOptions
  ): Promise<TitleSummaryResult> {
    try {
      return await withRetry(async () => {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(this.apiKey);
        
        // Important: Explicitly use API v1 for newer models
        const model = genAI.getGenerativeModel({ 
          model: this.textModel
        }, { 
          apiVersion: 'v1' 
        });

        // Set up style based on options
        const titleStyle = titleOptions?.style || 'engaging';
        const summaryStyle = summaryOptions?.style || 'concise';
        const language = titleOptions?.language || summaryOptions?.language || 'English';
        
        // Limit transcript length to avoid token limits
        const truncatedTranscript = transcript.length > 12000 
          ? transcript.substring(0, 12000) + "..." 
          : transcript;

        // Create a prompt for title and summary generation
        const prompt = `
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

        const result = await model.generateContent(prompt);
        const textResult = result.response.text();
        
        // Parse JSON response
        try {
          const parsed = JSON.parse(textResult);
          return {
            title: parsed.title || 'Untitled Episode',
            summary: parsed.summary || 'No summary available.'
          };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // If JSON parsing fails, try to extract title and summary using regex
          const titleMatch = textResult.match(/"title":\s*"([^"]+)"/);
          const summaryMatch = textResult.match(/"summary":\s*"([^"]+)"/);
          
          return {
            title: titleMatch ? titleMatch[1] : 'Untitled Episode',
            summary: summaryMatch ? summaryMatch[1] : 'No summary available.'
          };
        }
      }, this.retryConfig);
    } catch (error) {
      console.error('Error generating title and summary:', error);
      return {
        title: 'Untitled Episode',
        summary: 'Failed to generate summary due to an error.'
      };
    }
  }

  /**
   * Generate an image based on a description
   */
  async generateImage(
    description: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    // Delegate to the specialized image generator
    return this.imageGenerator.generateImage(description, options);
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
  }): Promise<string> {
    return this.textGenerator.generateText(prompt, options);
  }
} 