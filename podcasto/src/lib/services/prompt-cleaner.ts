/**
 * Utilities for cleaning and processing AI-generated text
 */
export class PromptCleaner {
  /**
   * Clean the image prompt result to remove any explanations or additional text
   */
  cleanImagePromptResult(text: string): string {
    if (!text) return '';
    
    // Log the original text for debugging
    console.log(`[PROMPT_CLEANER] Cleaning prompt text. Original first 100 chars: "${text.substring(0, 100)}..."`);
    
    // Remove common prefixes that models often include
    let cleanText = text.trim()
      // Remove common headers/intros
      .replace(/^(Image prompt:|Image description:|Here's the image prompt:|Here's a detailed description:|Prompt:|Description:)/i, '')
      .replace(/^(Here is |I would create |I would suggest |Let me create |Here's |Sure, |Okay, |I'll |I'd |I have |I understand |I'm |I will )/i, '')
      .replace(/^(Let me |Based on |For this |This |The |A )/i, '')
      
      // Remove meta-comments about the task
      .replace(/^(Here's a visual description without any text elements:|Here's a rich visual description for a podcast cover image:|Let me create a detailed visual description for this podcast cover:)/i, '')
      
      // Remove quotes and formatting
      .replace(/^["'`]|["'`]$/g, '') // Remove wrapping quotes if present
      .trim();
    
    // If the result starts with phrase markers, try to clean those too
    cleanText = cleanText
      .replace(/^(The image shows |The image would feature |The image would show |The image would depict |The image could |The cover would |The cover image would |The podcast cover would )/i, '')
      .trim();
    
    // If the text contains multiple paragraphs, try to identify where the actual description starts
    const paragraphs = cleanText.split(/\n\n+/);
    if (paragraphs.length > 1) {
      // If the first paragraph is short and looks like an introduction, use from the second paragraph
      if (paragraphs[0].length < 150 && 
         (paragraphs[0].toLowerCase().includes('description') || 
          paragraphs[0].toLowerCase().includes('prompt') || 
          paragraphs[0].toLowerCase().includes('here is') ||
          paragraphs[0].toLowerCase().includes('based on') ||
          paragraphs[0].toLowerCase().includes('understand') ||
          paragraphs[0].toLowerCase().includes('generate') ||
          paragraphs[0].toLowerCase().includes('create') ||
          paragraphs[0].toLowerCase().includes('podcast cover'))) {
        cleanText = paragraphs.slice(1).join('\n\n');
      }
    }
    
    // Additional cleaning for common line formats
    const lines = cleanText.split('\n');
    if (lines.length > 1) {
      // Check if first line looks like a header/title
      if (lines[0].length < 100 && 
         (lines[0].includes('**') || 
          lines[0].includes('Visual Description:') || 
          lines[0].includes('Description:') ||
          lines[0].includes('Cover Image:') ||
          lines[0].endsWith(':') ||
          lines[0].toUpperCase() === lines[0])) {  // All caps line is likely a header
        cleanText = lines.slice(1).join('\n');
      }
    }
    
    // Log the cleaned text
    console.log(`[PROMPT_CLEANER] Cleaned prompt text. First 100 chars: "${cleanText.substring(0, 100)}..."`);
    
    return cleanText.trim();
  }

  /**
   * Extract a visual description from JSON response
   */
  extractVisualDescription(jsonText: string): string | null {
    try {
      // Try to extract JSON object from the string
      const jsonMatch = jsonText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (jsonData.visualDescription) {
          // We successfully got a structured response
          const cleanDescription = jsonData.visualDescription.trim();
          console.log(`[PROMPT_CLEANER] Successfully extracted visual description from JSON (${cleanDescription.length} chars)`);
          return cleanDescription;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`[PROMPT_CLEANER] Failed to parse JSON: ${error}`);
      return null;
    }
  }
}

/**
 * Create a prompt cleaner utility
 */
export function createPromptCleaner(): PromptCleaner {
  return new PromptCleaner();
} 