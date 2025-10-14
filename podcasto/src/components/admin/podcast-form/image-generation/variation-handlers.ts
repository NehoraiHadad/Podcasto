import { imageToasts } from '@/components/admin/shared/image-management';
import type { GeneratedVariation } from './types';

export function createSelectVariationHandler(
  generatedVariations: GeneratedVariation[],
  setGeneratedVariations: (variations: GeneratedVariation[]) => void,
  onImageGenerated?: (imageUrl: string) => void
) {
  return (index: number) => {
    const variations = generatedVariations.map((v, i) => ({ ...v, selected: i === index }));
    setGeneratedVariations(variations);

    const selectedVariation = variations.find(v => v.selected);
    if (selectedVariation) {
      onImageGenerated?.(selectedVariation.base64Data);
      imageToasts.selectionSuccess();
    }
  };
}

export function createDeleteVariationHandler(
  generatedVariations: GeneratedVariation[],
  setGeneratedVariations: (variations: GeneratedVariation[]) => void,
  setDebugInfo: (info: any) => void,
  onImageGenerated?: (imageUrl: string) => void
) {
  return (index: number) => {
    const updatedVariations = generatedVariations.filter(v => v.index !== index);
    const reindexedVariations = updatedVariations.map((v, i) => ({ ...v, index: i }));

    setGeneratedVariations(reindexedVariations);

    const wasSelected = generatedVariations[index].selected;
    if (wasSelected && reindexedVariations.length > 0) {
      reindexedVariations[0].selected = true;
      onImageGenerated?.(reindexedVariations[0].base64Data);
    }

    imageToasts.variationDeleted(wasSelected && reindexedVariations.length > 0);

    if (reindexedVariations.length === 0) {
      onImageGenerated?.('');
      setGeneratedVariations([]);
      setDebugInfo(null);
    }
  };
}
