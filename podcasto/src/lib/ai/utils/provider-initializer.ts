import type { AIProvider, AIProviderConfig, ProviderType } from '../types';
import { GeminiProvider } from '../providers/gemini';
// Import other providers here as needed

/**
 * Initializes the appropriate AI provider based on configuration.
 *
 * @param config - The configuration containing provider type and credentials.
 * @returns An instance of the AIProvider.
 */
export function initializeProvider(
  providerType: ProviderType,
  config: AIProviderConfig,
): AIProvider {
  console.log(`[AI_SERVICE_UTIL] Initializing provider: ${providerType}`);

  switch (providerType) {
    case 'gemini':
      return new GeminiProvider(config);
    // Add cases for other providers like 'openai' here
    // case 'openai':
    //   return new OpenAIProvider(config);
    default:
      // Default to Gemini if the provider is not recognized or add error handling
      console.warn(
        `[AI_SERVICE_UTIL] Provider "${providerType}" not recognized, defaulting to Gemini.`,
      );
      return new GeminiProvider(config);
  }
} 