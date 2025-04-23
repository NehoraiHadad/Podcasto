# Gemini AI Integration

This document provides guidance on using the latest Gemini AI models within the Podcasto application.

## Model Usage

The application now exclusively uses the latest Gemini models for optimal performance:

1. **Gemini 2.5** - Latest models with enhanced thinking capabilities
   - `gemini-2.5-pro` - Most advanced reasoning capabilities, used for complex tasks

2. **Gemini 2.0** - Modern, high-performance models
   - `gemini-2.0-flash` - Fast model with balanced capabilities
   - `gemini-2.0-pro` - Advanced model for code and complex reasoning
   - `gemini-2.0-flash-exp-image-generation` - Specialized for image generation

## Model Selection

The application includes a simplified ModelSelector utility that recommends the best model for each task:

```typescript
// Import the ModelSelector
import { ModelSelector } from '@/lib/ai/utils/model-selection';

// Get a recommended model for a specific task
const textModel = ModelSelector.getRecommendedModel('text-generation');

// Get the specialized model for image prompts
const imagePromptModel = ModelSelector.getImagePromptModel();
```

### Task-Specific Model Recommendations

| Task | Recommended Model |
|------|-------------------|
| Text Generation | `gemini-2.0-flash` |
| Image Generation | `gemini-2.0-flash-exp-image-generation` |
| Title/Summary | `gemini-2.0-flash` |
| Complex Reasoning | `gemini-2.5-pro` |
| Code Generation | `gemini-2.0-pro` |
| Image Prompts | `gemini-2.0-pro` |

## Example Usage

Here's how to initialize the GeminiProvider with the appropriate model:

```typescript
// Import components
const { GeminiProvider } = await import('@/lib/ai/providers/gemini');
const { ModelSelector } = await import('@/lib/ai/utils/model-selection');

// Get the best model for text generation
const textModel = ModelSelector.getRecommendedModel('text-generation');

// Initialize the provider
const provider = new GeminiProvider({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: textModel
});

// Generate text
const result = await provider.generateText("Write a short paragraph about podcasts");
```

## Required Package Version

To use these latest models, ensure you have the most current version of the Google Generative AI library:

```bash
npm install @google/generative-ai@latest
```

## Troubleshooting

If you encounter errors related to image generation:

1. Ensure you're using the correct model (`gemini-2.0-flash-exp-image-generation`)
2. Check that the Google API key has the necessary permissions
3. Verify that your prompt adheres to content safety guidelines 
4. If needed, use the specialized model for generating image prompts (`gemini-2.0-pro`) 