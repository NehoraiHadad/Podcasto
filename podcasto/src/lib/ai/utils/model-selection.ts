/**
 * Task-specific model requirements
 */
export type ModelTask = 
  | 'text-generation' 
  | 'image-generation' 
  | 'title-summary' 
  | 'reasoning' 
  | 'code';

/**
 * Utility for selecting appropriate models for different tasks
 */
export const ModelSelector = {
  /**
   * Get the recommended model for a specific task
   */
  getRecommendedModel(task: ModelTask): string {
    switch (task) {
      case 'text-generation':
      case 'title-summary':
      case 'code':
        return 'gemini-2.0-flash';
        
      case 'image-generation':
        return 'gemini-2.5-flash-image';
        
      case 'reasoning':
      default:
        return 'gemini-2.5-pro';
    }
  },
  
  /**
   * Get the best model for image prompt generation
   */
  getImagePromptModel(): string {
    return 'gemini-2.0-flash';
  }
}; 