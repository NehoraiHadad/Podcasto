import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../utils/retry';

/**
 * Options for generating text
 */
export interface TextGenerationOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
  responseSchema?: object; // Schema for structured JSON output
}

/**
 * Handles text generation operations for the Gemini provider
 */
export class GeminiTextGenerator {
  private apiKey: string;
  private textModel: string;
  private retryConfig: RetryConfig;

  /**
   * Initialize the Gemini text generator
   */
  constructor(apiKey: string, textModel: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.textModel = textModel;
    this.retryConfig = DEFAULT_RETRY_CONFIG;
  }

  /**
   * Generate text from a prompt
   */
  async generateText(
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<string> {
    try {
      return await withRetry(async () => {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        
        // Prepare generation config
        const config: {
          temperature?: number;
          topP?: number;
          topK?: number;
          maxOutputTokens?: number;
          stopSequences?: string[];
        } = {
          temperature: options?.temperature ?? 0.5,
          topP: options?.topP ?? 0.95,
          topK: options?.topK ?? 40,
          maxOutputTokens: options?.maxOutputTokens ?? 1024,
          stopSequences: options?.stopSequences
        };
        
        // Generate content using the new SDK
        const response = await ai.models.generateContent({
          model: this.textModel,
          contents: prompt,
          config
        });
        
        // Get the response text
        const text = response.text || '';
        
        return text;
      }, this.retryConfig);
    } catch (error) {
      console.error('[GEMINI_TEXT] Error generating text:', error);
      return '';
    }
  }

  /**
   * Generate a summary for a podcast episode based on the transcript
   */
  async generateSummary(transcript: string): Promise<string> {
    const prompt = `
    Summarize the following podcast transcript in a concise way:

    ${transcript}

    Write a summary that captures the main points and key insights from the conversation.
    The summary should be informative and engaging, similar to a podcast episode description.
    Use 3-5 paragraphs and highlight the most valuable content.
    `;
    
    return this.generateText(prompt);
  }

  /**
   * Generate a title for a podcast episode based on the transcript and/or summary
   */
  async generateTitle(input: string): Promise<string> {
    const prompt = `
    Create an engaging and concise title for a podcast episode based on the following content:

    ${input}

    The title should:
    - Be catchy and memorable (30-60 characters)
    - Clearly indicate what the episode is about
    - Use meaningful and specific language (avoid clickbait)
    - Be optimized for search while remaining natural-sounding
    
    Respond with ONLY the title, no additional text or explanation.
    `;
    
    return this.generateText(prompt);
  }
} 