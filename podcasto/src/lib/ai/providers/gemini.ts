import {
  AIProvider,
  AIProviderConfig,
  ImageGenerationOptions,
  ImageGenerationResult,
  TitleGenerationOptions,
  SummaryGenerationOptions,
  TitleSummaryResult
} from '../types';
import { withRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../utils/retry';

/**
 * Gemini AI provider implementation
 */
export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private baseUrl?: string;
  private titleSummaryModel: string;
  private imageGenModel: string;
  private retryConfig: RetryConfig;

  /**
   * Initialize the Gemini provider
   */
  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    
    // Default models or use provided one
    this.titleSummaryModel = config.modelName || 'gemini-1.5-flash';
    
    // Use the correct model for image generation
    this.imageGenModel = 'gemini-2.0-flash-exp-image-generation';
    
    // Default retry configuration
    this.retryConfig = DEFAULT_RETRY_CONFIG;
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
        const model = genAI.getGenerativeModel({ model: this.titleSummaryModel });

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
        } catch (error) {
          // If JSON parsing fails, try to extract title and summary using regex
          const titleMatch = textResult.match(/\"title\":\s*\"([^\"]+)\"/);
          const summaryMatch = textResult.match(/\"summary\":\s*\"([^\"]+)\"/);
          
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
    try {
      return await withRetry(async () => {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(this.apiKey);
        
        // Add style context to description
        const style = options?.style || 'modern, professional';
        const enhancedPrompt = `
          Generate an image for a podcast episode with the following description:
          ${description}
          
          The image should be in ${style} style, suitable for a podcast cover.
          Make it visually appealing and relevant to the content.
          Create a high-quality, detailed image that represents this podcast episode.
        `;
        
        // Use the Gemini model with image generation capabilities
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp'
        });
        
        // Call generateContent with the prompt
        const result = await model.generateContent(enhancedPrompt);
        
        const response = result.response;
        let imageData = null;
        let mimeType = 'image/jpeg';
        
        // Safely access parts if they exist
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              // Convert base64 data to Buffer
              const base64Data = part.inlineData.data;
              imageData = Buffer.from(base64Data, 'base64');
              mimeType = part.inlineData.mimeType || 'image/jpeg';
              break;
            }
          }
        }
        
        return {
          imageData,
          mimeType
        };
      }, this.retryConfig);
    } catch (error) {
      console.error('Error generating image:', error);
      return {
        imageData: null,
        mimeType: 'image/jpeg'
      };
    }
  }
} 