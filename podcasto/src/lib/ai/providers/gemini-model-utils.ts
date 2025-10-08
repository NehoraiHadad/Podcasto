/**
 * Utility functions for working with Gemini models
 */

/**
 * Lists available models from the Gemini API
 * 
 * @param apiKey - The API key for Gemini
 * @returns An array of available model names
 */
export async function listGeminiModels(apiKey: string): Promise<string[]> {
  try {
    // Use direct API call since listModels may not be available in all versions
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      const modelNames = data.models.map((model: { name: string }) => model.name);
      console.log('[GEMINI_UTILS] Available Gemini models:', modelNames);
      return modelNames;
    }
    
    // Return default models if API call doesn't return expected data
    return ['gemini-2.5-pro', 'gemini-2.0-flash'];
  } catch (error) {
    console.error('[GEMINI_UTILS] Error listing models:', error);
    return ['gemini-2.5-pro', 'gemini-2.0-flash'];
  }
}

/**
 * Gets the best model for a specific task based on availability
 * 
 * @param apiKey - The API key for Gemini
 * @param taskType - The type of task ('text', 'image', 'chat')
 * @returns The name of the best available model for the task
 */
export async function getBestModelForTask(
  apiKey: string, 
  taskType: 'text' | 'image' | 'chat'
): Promise<string> {
  try {
    const models = await listGeminiModels(apiKey);
    
    // Model preference order based on task type
    const modelPreferences: Record<string, string[]> = {
      text: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
      image: ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation', 'gemini-1.5-pro-vision'],
      chat: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-2.0-flash']
    };
    
    // Find the first available preferred model
    const preferredModels = modelPreferences[taskType];
    for (const model of preferredModels) {
      // Strip API version path from model names for comparison
      const normalizedModels = models.map(m => m.split('/').pop());
      if (normalizedModels.includes(model)) {
        return model;
      }
    }
    
    // Default models if none of the preferred ones are available
    const defaults = {
      text: 'gemini-2.0-flash',
      image: 'gemini-2.5-flash-image',
      chat: 'gemini-2.5-pro'
    };
    
    return defaults[taskType];
  } catch (error) {
    console.error('[GEMINI_UTILS] Error determining best model:', error);
    
    // Fallback defaults
    const defaults = {
      text: 'gemini-2.0-flash',
      image: 'gemini-2.5-flash-image',
      chat: 'gemini-2.5-pro'
    };
    
    return defaults[taskType];
  }
} 