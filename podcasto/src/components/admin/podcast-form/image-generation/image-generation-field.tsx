'use client';

import { useState } from 'react';
import { imageToasts } from '@/components/admin/shared/image-management';
import { PODCAST_IMAGE_STYLES, VARIATION_OPTIONS } from '@/lib/constants/podcast-image-styles';
import { ImageSourceSelector } from './image-source-selector';
import { StyleSelector } from './style-selector';
import { GeneratedImagePreview } from './generated-image-preview';
import { VariationGallery } from './variation-gallery';
import { GalleryBrowser } from './gallery-browser';
import { DebugInfoPanel } from './debug-info-panel';
import { ActionButtons } from './action-buttons';
import { useImageGeneration } from './use-image-generation';
import { useGalleryOperations } from './use-gallery-operations';
import type { ImageGenerationFieldProps, ImageSource } from './types';

export function ImageGenerationField({
  podcastId,
  currentImageUrl,
  telegramChannel,
  podcastTitle = 'My Podcast',
  savedImageStyle,
  onImageGenerated
}: ImageGenerationFieldProps) {
  const [imageSource, setImageSource] = useState<ImageSource>('telegram');
  const [selectedStyle, setSelectedStyle] = useState(
    savedImageStyle && PODCAST_IMAGE_STYLES.find(s => s.id === savedImageStyle)
      ? savedImageStyle
      : PODCAST_IMAGE_STYLES[0].id
  );
  const [variationCount, setVariationCount] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  const {
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
  } = useImageGeneration({ podcastId, podcastTitle, onImageGenerated });

  const { handleLoadGallery, handleSelectFromGallery, handleDeleteGalleryImage } = useGalleryOperations(
    podcastId,
    setGalleryImages,
    setShowGallery,
    setIsLoadingGallery,
    onImageGenerated
  );

  const handleDeleteCurrentImage = () => {
    onImageGenerated?.('');
    imageToasts.imageRemoved();
  };

  const selectedVariationOption = VARIATION_OPTIONS.find(v => v.count === variationCount);

  return (
    <div className="space-y-6">
      {!podcastId && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          <p className="font-medium">Creating mode</p>
          <p className="text-blue-600 mt-1">
            Generated images will be saved with your podcast when you create it.
          </p>
        </div>
      )}

      <GeneratedImagePreview currentImageUrl={currentImageUrl} onDelete={handleDeleteCurrentImage} />

      <ImageSourceSelector
        imageSource={imageSource}
        telegramChannel={telegramChannel}
        uploadedFile={uploadedFile}
        manualUrl={manualUrl}
        onSourceChange={setImageSource}
        onFileUpload={setUploadedFile}
        onUrlChange={setManualUrl}
      />

      <StyleSelector
        selectedStyle={selectedStyle}
        savedImageStyle={savedImageStyle}
        variationCount={variationCount}
        onStyleChange={setSelectedStyle}
        onVariationCountChange={setVariationCount}
      />

      <ActionButtons
        isGenerating={isGenerating}
        isLoadingGallery={isLoadingGallery}
        variationCount={variationCount}
        selectedVariationLabel={selectedVariationOption?.label}
        onGenerate={() => handleGenerate(imageSource, selectedStyle, variationCount, telegramChannel, uploadedFile, manualUrl)}
        onLoadGallery={podcastId ? handleLoadGallery : undefined}
      />

      {podcastId && (
        <GalleryBrowser
          isOpen={showGallery}
          images={galleryImages}
          onClose={() => setShowGallery(false)}
          onSelectImage={handleSelectFromGallery}
          onDeleteImage={handleDeleteGalleryImage}
        />
      )}

      <DebugInfoPanel debugInfo={debugInfo} />

      <VariationGallery
        variations={generatedVariations}
        onSelectVariation={handleSelectVariation}
        onDeleteVariation={handleDeleteVariation}
      />
    </div>
  );
}
