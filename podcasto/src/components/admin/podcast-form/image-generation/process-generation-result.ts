import { imageToasts } from '@/components/admin/shared/image-management';
import type { GeneratedVariation, GenerationDebugInfo } from './types';

interface ImageGenerationResult {
  success: boolean;
  error?: string;
  originalImageData?: string;
  analysis?: GenerationDebugInfo['analysis'];
  prompt?: string;
  mimeType?: string;
  imageDatas?: string[];
  imageData?: string;
  enhancedWithAI?: boolean;
}

export function processGenerationResult(
  result: unknown,
  onImageGenerated?: (imageUrl: string) => void
): {
  variations: GeneratedVariation[];
  debugInfo: GenerationDebugInfo | null;
} | null {
  // Type guard to ensure result is an object with expected properties
  if (!result || typeof result !== 'object') {
    imageToasts.error('Invalid generation result');
    return null;
  }

  const generationResult = result as ImageGenerationResult;

  if (!generationResult.success) {
    imageToasts.error(generationResult.error || 'Failed to generate image');
    return null;
  }

  const debugInfo = {
    originalImageData: generationResult.originalImageData,
    analysis: generationResult.analysis,
    prompt: generationResult.prompt
  };

  const mimeType = generationResult.mimeType || 'image/jpeg';
  const imageDatas = generationResult.imageDatas || (generationResult.imageData ? [generationResult.imageData] : []);

  if (imageDatas.length === 0) {
    return null;
  }

  const variations: GeneratedVariation[] = imageDatas.map((base64: string, index: number) => ({
    url: `data:${mimeType};base64,${base64}`,
    base64Data: base64,
    index,
    selected: index === 0
  }));

  onImageGenerated?.(variations[0].base64Data);

  imageToasts.generationSuccess(variations.length, generationResult.enhancedWithAI);

  return { variations, debugInfo };
}
