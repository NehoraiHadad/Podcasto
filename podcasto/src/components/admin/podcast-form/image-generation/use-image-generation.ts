import { useState } from 'react';
import { toast } from 'sonner';
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
    if (!podcastId) {
      toast.error('Please save the podcast first');
      return;
    }

    if (imageSource === 'telegram' && !telegramChannel) {
      toast.error('No Telegram channel configured');
      return;
    }
    if (imageSource === 'upload' && !uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }
    if (imageSource === 'url' && !manualUrl) {
      toast.error('Please enter an image URL');
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

      switch (imageSource) {
        case 'telegram':
          result = await generatePodcastImageFromTelegram(podcastId, generationOptions);
          break;
        case 'upload':
          if (uploadedFile) {
            const base64Image = await fileToBase64(uploadedFile);
            result = await generatePodcastImageFromFile(
              podcastId,
              base64Image,
              uploadedFile.type,
              podcastTitle || 'My Podcast',
              generationOptions
            );
          }
          break;
        case 'url':
          result = await generatePodcastImageFromUrl(
            podcastId,
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
      toast.error('Failed to generate image');
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
