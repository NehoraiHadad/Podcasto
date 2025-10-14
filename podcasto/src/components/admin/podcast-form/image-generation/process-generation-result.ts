import { imageToasts } from '@/components/admin/shared/image-management';
import type { GeneratedVariation } from './types';

export function processGenerationResult(
  result: any,
  onImageGenerated?: (imageUrl: string) => void
): {
  variations: GeneratedVariation[];
  debugInfo: { originalImageData?: string; analysis?: any; prompt?: string } | null;
} | null {
  if (!result?.success) {
    imageToasts.error(result?.error || 'Failed to generate image');
    return null;
  }

  const debugInfo = {
    originalImageData: result.originalImageData,
    analysis: result.analysis,
    prompt: result.prompt
  };

  const mimeType = result.mimeType || 'image/jpeg';
  const imageDatas = result.imageDatas || (result.imageData ? [result.imageData] : []);

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

  imageToasts.generationSuccess(variations.length, result.enhancedWithAI);

  return { variations, debugInfo };
}
