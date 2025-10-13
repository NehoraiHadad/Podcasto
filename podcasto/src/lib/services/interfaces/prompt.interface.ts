/**
 * Prompt Service Interfaces
 * Type-safe contracts for AI prompt generation and cleaning
 */

/**
 * Prompt generator configuration
 */
export interface PromptGeneratorConfig {
  apiKey: string;
  modelName?: string;
}

/**
 * Prompt Generator Interface
 * Generates and processes AI prompts for image generation
 */
export interface IPromptGenerator {
  /**
   * Generate an AI-enhanced image prompt from episode summary
   * Uses AI model to create detailed visual descriptions suitable for image generation
   * @param summary - Episode summary
   * @param title - Optional episode title
   * @returns Enhanced image generation prompt
   * @throws Error if prompt generation fails (returns fallback prompt)
   */
  generateImagePrompt(summary: string, title?: string): Promise<string>;
}

/**
 * Prompt Cleaner Interface
 * Cleans and sanitizes AI-generated prompts
 */
export interface IPromptCleaner {
  /**
   * Extract visual description from JSON response
   * Parses AI response and extracts the visualDescription field
   * @param text - Raw AI response text
   * @returns Extracted visual description or null if parsing fails
   */
  extractVisualDescription(text: string): string | null;

  /**
   * Clean image prompt result by removing unwanted patterns
   * Removes markdown, JSON artifacts, and explanatory text
   * @param text - Raw prompt text
   * @returns Cleaned prompt text
   */
  cleanImagePromptResult(text: string): string;
}
