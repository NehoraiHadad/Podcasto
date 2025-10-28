'use client';

import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, Images, X } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { imageToasts, validateImageFile, LoadingButton } from '@/components/admin/shared/image-management';
import { PODCAST_IMAGE_STYLES, VARIATION_OPTIONS } from '@/lib/constants/podcast-image-styles';
import {
  generatePodcastImageFromTelegram,
  generatePodcastImageFromFile,
  generatePodcastImageFromUrl,
  listPodcastImagesGallery,
  deleteGalleryImage,
} from '@/lib/actions/podcast';
import type { GalleryImage } from '@/lib/actions/podcast';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

interface ImageUploadSectionProps {
  control: Control<any>;
  disabled?: boolean;
  showAIGeneration?: boolean;
  podcastId?: string;
  podcastTitle?: string;
  telegramChannel?: string;
}

type ImageSource = 'telegram' | 'upload' | 'url';

interface GeneratedVariation {
  url: string;
  base64Data: string;
  index: number;
  selected: boolean;
}

/**
 * Enhanced Image Upload Section with AI Generation
 *
 * Supports:
 * - Direct URL input (always available)
 * - File upload (placeholder)
 * - AI generation with style selection (optional, controlled by showAIGeneration prop)
 * - Variation generation (1-3 images)
 * - Image gallery browser (for existing podcasts)
 * - Image preview and management
 *
 * Fields controlled:
 * - cover_image: URL to the podcast cover image
 * - image_style: Selected image style ID (used for regeneration)
 */
export function ImageUploadSection({
  control,
  disabled = false,
  showAIGeneration = false,
  podcastId,
  podcastTitle = 'My Podcast',
  telegramChannel,
}: ImageUploadSectionProps) {
  const [uploadError, setUploadError] = useState<string>('');
  const coverImage = useWatch({ control, name: 'cover_image' });
  const { setValue } = useFormContext();

  // AI Generation state
  const [imageSource, setImageSource] = useState<ImageSource>('telegram');
  const [selectedStyle, setSelectedStyle] = useState(PODCAST_IMAGE_STYLES[0].id);
  const [variationCount, setVariationCount] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);

  // Gallery state
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadError('File upload not yet implemented. Please use a URL instead.');
  };

  const handleDeleteCurrentImage = () => {
    setValue('cover_image', '');
    imageToasts.imageRemoved();
  };

  // AI Generation handlers
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

  const handleGenerate = async () => {
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

    try {
      const styleData = PODCAST_IMAGE_STYLES.find(s => s.id === selectedStyle);
      const stylePrompt = styleData?.promptModifier || 'modern, professional';
      const generationOptions = {
        style: stylePrompt,
        styleId: selectedStyle,
        variationsCount: variationCount
      };

      const effectivePodcastId = podcastId || null;
      let result;

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
              podcastTitle,
              generationOptions
            );
          }
          break;
        case 'url':
          result = await generatePodcastImageFromUrl(
            effectivePodcastId,
            manualUrl || '',
            podcastTitle,
            generationOptions
          );
          break;
      }

      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          const imageDatas = (result as any).imageDatas || ((result as any).imageData ? [(result as any).imageData] : []);
          const mimeType = (result as any).mimeType || 'image/jpeg';

          if (imageDatas.length > 0) {
            const variations: GeneratedVariation[] = imageDatas.map((base64: string, index: number) => ({
              url: `data:${mimeType};base64,${base64}`,
              base64Data: base64,
              index,
              selected: index === 0
            }));

            setGeneratedVariations(variations);

            // Update form field with first variation
            setValue('cover_image', variations[0].base64Data);
            setValue('image_style', selectedStyle);

            imageToasts.generationSuccess(variations.length, (result as any).enhancedWithAI);
          }
        } else {
          imageToasts.error((result as any).error || 'Failed to generate image');
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      imageToasts.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = (index: number) => {
    const variations = generatedVariations.map((v, i) => ({ ...v, selected: i === index }));
    setGeneratedVariations(variations);

    const selectedVariation = variations.find(v => v.selected);
    if (selectedVariation) {
      setValue('cover_image', selectedVariation.base64Data);
      imageToasts.selectionSuccess();
    }
  };

  const handleDeleteVariation = (index: number) => {
    const updatedVariations = generatedVariations.filter(v => v.index !== index);
    const reindexedVariations = updatedVariations.map((v, i) => ({ ...v, index: i }));

    setGeneratedVariations(reindexedVariations);

    const wasSelected = generatedVariations[index].selected;
    if (wasSelected && reindexedVariations.length > 0) {
      reindexedVariations[0].selected = true;
      setValue('cover_image', reindexedVariations[0].base64Data);
    }

    imageToasts.variationDeleted(wasSelected && reindexedVariations.length > 0);

    if (reindexedVariations.length === 0) {
      setValue('cover_image', '');
      setGeneratedVariations([]);
    }
  };

  // Gallery handlers
  const handleLoadGallery = async () => {
    if (!podcastId) {
      imageToasts.savePodcastFirst();
      return;
    }

    setIsLoadingGallery(true);
    try {
      const result = await listPodcastImagesGallery(podcastId);

      if (result.success && result.images) {
        setGalleryImages(result.images);
        setShowGallery(true);

        if (result.images.length === 0) {
          imageToasts.galleryEmpty();
        } else {
          imageToasts.galleryLoadSuccess(result.images.length);
        }
      } else {
        imageToasts.loadGalleryError(result.error);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      imageToasts.loadGalleryError();
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleSelectFromGallery = (image: GalleryImage) => {
    setValue('cover_image', image.url);
    setShowGallery(false);
    imageToasts.imageSelectedFromGallery();
  };

  const handleDeleteGalleryImage = async (image: GalleryImage) => {
    try {
      const result = await deleteGalleryImage(image.key);

      if (result.success) {
        setGalleryImages(prev => prev.filter(img => img.key !== image.key));
        imageToasts.deleteSuccess();
      } else {
        imageToasts.deleteGalleryImageError(result.error);
      }
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      imageToasts.deleteGalleryImageError();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        imageToasts.error(validation.error!);
        return;
      }
      setUploadedFile(file);
      imageToasts.uploadSuccess();
    }
  };

  const selectedStyleData = PODCAST_IMAGE_STYLES.find(s => s.id === selectedStyle);
  const selectedVariationOption = VARIATION_OPTIONS.find(v => v.count === variationCount);

  return (
    <div className="space-y-6">
      {/* Current Image Preview */}
      {coverImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Current Cover Image</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeleteCurrentImage}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          <div className="relative w-full aspect-square max-w-[250px] sm:max-w-xs rounded-lg overflow-hidden border">
            <Image
              src={coverImage.startsWith('data:') ? coverImage : coverImage}
              alt="Current cover"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* AI Generation Section (conditional) */}
      {showAIGeneration && (
        <>
          {!podcastId && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
              <p className="font-medium">Creating mode</p>
              <p className="text-blue-600 dark:text-blue-400 mt-1">
                Generated images will be saved with your podcast when you create it.
              </p>
            </div>
          )}

          {/* Image Source Selector */}
          <div className="space-y-3">
            <Label>Image Source</Label>
            <RadioGroup value={imageSource} onValueChange={(value) => setImageSource(value as ImageSource)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="telegram" id="telegram" disabled={!telegramChannel} />
                <Label
                  htmlFor="telegram"
                  className={`font-normal cursor-pointer ${!telegramChannel ? 'text-muted-foreground' : ''}`}
                >
                  Auto from Telegram Channel {telegramChannel ? `(@${telegramChannel})` : '(configure in Content tab)'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="upload" />
                <Label htmlFor="upload" className="font-normal cursor-pointer">
                  Upload Image File
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="url" />
                <Label htmlFor="url" className="font-normal cursor-pointer">
                  Manual URL
                </Label>
              </div>
            </RadioGroup>

            {imageSource === 'upload' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="file-upload">Upload Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {uploadedFile && (
                    <span className="text-sm text-muted-foreground">
                      {uploadedFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
                </p>
              </div>
            )}

            {imageSource === 'url' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="manual-url">Image URL</Label>
                <Input
                  id="manual-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a publicly accessible image URL
                </p>
              </div>
            )}
          </div>

          {/* Style Selector */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="style-select">Image Style</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger id="style-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PODCAST_IMAGE_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStyleData && (
                <p className="text-sm text-muted-foreground">
                  {selectedStyleData.description}
                </p>
              )}
            </div>

            {/* Variation Count Selection */}
            <div className="space-y-3">
              <Label>Number of Variations (A/B Testing)</Label>
              <RadioGroup
                value={String(variationCount)}
                onValueChange={(value) => setVariationCount(Number(value))}
              >
                {VARIATION_OPTIONS.map((option) => (
                  <div key={option.count} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(option.count)} id={`variation-${option.count}`} />
                    <Label htmlFor={`variation-${option.count}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Generate multiple variations to choose the best one for your podcast
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <LoadingButton
              type="button"
              isLoading={isGenerating}
              loadingText={variationCount > 1 ? `Generating ${variationCount} variations...` : 'Generating image...'}
              idleText={selectedVariationOption?.label ? `Generate with AI (${selectedVariationOption.label})` : 'Generate with AI'}
              idleIcon={<Sparkles className="mr-2 h-4 w-4" />}
              onClick={handleGenerate}
              className="flex-1 w-full sm:w-auto"
            />

            {podcastId && (
              <LoadingButton
                type="button"
                isLoading={isLoadingGallery}
                loadingText="Loading..."
                idleText="Browse Gallery"
                idleIcon={<Images className="mr-2 h-4 w-4" />}
                onClick={handleLoadGallery}
                variant="outline"
                className="flex-1 w-full sm:w-auto"
              />
            )}
          </div>

          {/* Gallery Browser */}
          {podcastId && showGallery && (
            <div className="space-y-4 p-4 sm:p-6 bg-muted/50 rounded-lg border-2 border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold">Image Gallery</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select an image from previously generated versions
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGallery(false)}
                >
                  Close
                </Button>
              </div>

              {galleryImages.length === 0 ? (
                <div className="text-center py-8">
                  <Images className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No images found in gallery</p>
                  <p className="text-sm text-muted-foreground mt-1">Generate some images first!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                  {galleryImages.map((image) => (
                    <Card
                      key={image.key}
                      className="transition-all hover:ring-2 hover:ring-primary"
                    >
                      <CardContent className="p-0">
                        <div
                          className="relative w-full aspect-square rounded-t-lg overflow-hidden cursor-pointer group"
                          onClick={() => handleSelectFromGallery(image)}
                        >
                          <Image
                            src={image.url}
                            alt="Gallery image"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${image.key.split('/').pop()}"?`)) {
                                handleDeleteGalleryImage(image);
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="text-xs font-medium text-center capitalize">
                            {image.type}
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {formatUserDate(image.lastModified, DATE_FORMATS.DISPLAY_DATE)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated Variations Gallery */}
          {generatedVariations.length > 0 && (
            <div className="space-y-3">
              <Label>Generated Variations - Select One</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedVariations.map((variation) => (
                  <Card
                    key={variation.index}
                    className={`transition-all ${
                      variation.selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div
                        className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => handleSelectVariation(variation.index)}
                      >
                        <Image
                          src={variation.url}
                          alt={`Variation ${variation.index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {variation.selected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 left-2 h-7 w-7 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVariation(variation.index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-3 text-center text-sm">
                        Variation {variation.index + 1}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* URL Input (always available) */}
      <FormField
        control={control}
        name="cover_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {showAIGeneration ? 'Or paste image URL' : 'Cover Image URL'}
            </FormLabel>
            <Input
              type="url"
              placeholder="https://example.com/podcast-cover.jpg"
              disabled={disabled}
              {...field}
              value={field.value || ''}
            />
            <p className="text-sm text-muted-foreground">
              Direct URL to your podcast cover image (recommended: 1400x1400px)
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hidden file input (placeholder) */}
      {!showAIGeneration && (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image (Coming Soon)
            </Button>
          </div>

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={disabled}
          />
        </>
      )}

      {/* Hidden field for image_style */}
      <FormField
        control={control}
        name="image_style"
        render={({ field }) => (
          <input type="hidden" {...field} value={field.value || ''} />
        )}
      />
    </div>
  );
}
