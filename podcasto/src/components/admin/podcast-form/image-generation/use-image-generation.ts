import { useState } from 'react';
import { imageToasts } from '@/components/admin/shared/image-management';
import {
  generatePodcastImageFromTelegram,
  generatePodcastImageFromFile,
  generatePodcastImageFromUrl
} from '@/lib/actions/podcast';
import { PODCAST_IMAGE_STYLES } from '@/lib/constants/podcast-image-styles';
import { processGenerationResult } from './process-generation-result';
import { createSelectVariationHandler, createDeleteVariationHandler } from './variation-handlers';
import type { ImageSource, GeneratedVariation, GenerationDebugInfo, GalleryImage } from './types';

interface UseImageGenerationProps {
  podcastId?: string;
  podcastTitle?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

export function useImageGeneration({ podcastId, podcastTitle, onImageGenerated }: UseImageGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
  const [debugInfo, setDebugInfo] = useState<GenerationDebugInfo | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };


  const handleGenerate = async (
    imageSource: ImageSource,
    selectedStyle: string,
    variationCount: number,
    telegramChannel?: string | null,
    uploadedFile?: File | null,
    manualUrl?: string
  ) => {
    // Validation
    if (imageSource === 'telegram' && !telegramChannel) {
      imageToasts.noTelegramChannel();
      return;
    }
    if (imageSource === 'upload' && !uploadedFile) {
      imageToasts.noFile();
      return;
    }
    if (imageSource === 'url' && !manualUrl) {
      imageToasts.noImageUrl();
      return;
    }

    setIsGenerating(true);
    setGeneratedVariations([]);
    setDebugInfo(null);

    try {
      const styleData = PODCAST_IMAGE_STYLES.find(s => s.id === selectedStyle);
      const stylePrompt = styleData?.promptModifier || 'modern, professional';
      const generationOptions = {
        style: stylePrompt,
        styleId: selectedStyle,
        variationsCount: variationCount
      };

      let result;

      // If no podcastId, we're in creation mode - call actions with null podcastId
      const effectivePodcastId = podcastId || null;

      switch (imageSource) {
        case 'telegram':
          result = await generatePodcastImageFromTelegram(effectivePodcastId, {
            ...generationOptions,
            telegramChannel: telegramChannel || undefined,
            podcastTitle: podcastTitle
          });
          break;
        case 'upload':
          if (uploadedFile) {
            const base64Image = await fileToBase64(uploadedFile);
            result = await generatePodcastImageFromFile(
              effectivePodcastId,
              base64Image,
              uploadedFile.type,
              podcastTitle || 'My Podcast',
              generationOptions
            );
          }
          break;
        case 'url':
          result = await generatePodcastImageFromUrl(
            effectivePodcastId,
            manualUrl || '',
            podcastTitle || 'My Podcast',
            generationOptions
          );
          break;
      }

      const processed = processGenerationResult(result, onImageGenerated);
      if (processed) {
        setGeneratedVariations(processed.variations);
        setDebugInfo(processed.debugInfo);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      imageToasts.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = createSelectVariationHandler(
    generatedVariations,
    setGeneratedVariations,
    onImageGenerated
  );

  const handleDeleteVariation = createDeleteVariationHandler(
    generatedVariations,
    setGeneratedVariations,
    setDebugInfo,
    onImageGenerated
  );

  return {
    isGenerating,
    generatedVariations,
    debugInfo,
    showGallery,
    galleryImages,
    isLoadingGallery,
    setShowGallery,
    setIsLoadingGallery,
    handleGenerate,
    handleSelectVariation,
    handleDeleteVariation,
    setGalleryImages
  };
}
