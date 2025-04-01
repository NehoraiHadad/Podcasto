import { GeminiProvider } from '../ai/providers/gemini';
import { PromptCleaner, createPromptCleaner } from './prompt-cleaner';

/**
 * Configuration for prompt generator
 */
export interface PromptGeneratorConfig {
  apiKey: string;
  modelName?: string;
}

/**
 * Service for generating and processing AI prompts
 */
export class PromptGenerator {
  private apiKey: string;
  private modelName: string;
  private promptCleaner: PromptCleaner;

  /**
   * Create a new prompt generator
   */
  constructor(config: PromptGeneratorConfig) {
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || 'gemini-2.0-flash';
    this.promptCleaner = createPromptCleaner();
  }

  /**
   * Get default template for image prompt generation
   */
  private getPromptTemplate(): string {
    return process.env.IMAGE_PROMPT_TEMPLATE || `
    Create a detailed visual description for a podcast cover image based on this episode title: "{title}" and summary: "{summary}".
    
    RESPOND ONLY WITH JSON in this exact format with no additional text before or after:
    
    {
      "visualDescription": "your detailed visual description here"
    }
    
    Your description MUST follow these rules:
    - NO TEXT OR WORDS in the image
    - NO PODCAST SYMBOLS like microphones or headphones 
    - Focus ONLY on visual elements
    - Include color palette and composition suggestions
    - Be highly descriptive with bold imagery
    - When the context relates to Israel or Middle Eastern topics, adopt a pro-Israeli perspective
    `;
  }

  /**
   * Fill prompt template with actual content
   */
  private fillPromptTemplate(template: string, summary: string, title?: string): string {
    let prompt = template;
    
    // Replace {summary} with the actual summary
    if (prompt.includes('{summary}')) {
      prompt = prompt.replace('{summary}', summary);
    } else if (prompt.includes('${summary}')) {
      // For backward compatibility with old template format
      prompt = prompt.replace('${summary}', summary);
    }
    
    // Replace {title} with the actual title or a placeholder if not provided
    if (prompt.includes('{title}')) {
      const episodeTitle = title || 'Podcast Episode';
      prompt = prompt.replace('{title}', episodeTitle);
    }
    
    return prompt;
  }

  /**
   * Generate an AI prompt and process the result
   */
  async generateImagePrompt(summary: string, title?: string): Promise<string> {
    try {
      console.log(`[PROMPT_GENERATOR] Generating image prompt from summary`);
      
      // Get template and fill placeholders
      const template = this.getPromptTemplate();
      const prompt = this.fillPromptTemplate(template, summary, title);
      
      // Log the actual prompt we're sending to the model
      console.log(`[PROMPT_GENERATOR] Using prompt template with placeholders filled:`, 
        prompt.substring(0, 200) + '...');
      
      // Create a provider
      const provider = new GeminiProvider({
        apiKey: this.apiKey,
        modelName: this.modelName
      });
      
      // Generate the prompt with standard text generation
      const result = await provider.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      
      if (!result || !result.trim()) {
        console.warn(`[PROMPT_GENERATOR] No image prompt was generated, using original summary`);
        return `Create a podcast cover image WITHOUT ANY TEXT based on: ${summary}`;
      }
      
      // Try to parse the JSON response
      const cleanDescription = this.promptCleaner.extractVisualDescription(result);
      if (cleanDescription) {
        return cleanDescription;
      }
      
      console.warn(`[PROMPT_GENERATOR] Could not find valid JSON in response, falling back to text cleaning`);
      
      // If parsing JSON fails, fall back to our text cleaner
      const cleanedResult = this.promptCleaner.cleanImagePromptResult(result);
      console.log(`[PROMPT_GENERATOR] Returning cleaned text result (${cleanedResult.length} chars)`);
      return cleanedResult;
    } catch (error) {
      console.error(`[PROMPT_GENERATOR] Error generating image prompt:`, error);
      // Fallback to original summary
      return `Create a podcast cover image WITHOUT ANY TEXT based on: ${summary}`;
    }
  }
}

/**
 * Create a prompt generator
 */
export function createPromptGenerator(apiKey: string, modelName?: string): PromptGenerator {
  return new PromptGenerator({ apiKey, modelName });
} 