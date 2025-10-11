'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Check, ImageIcon, Images } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  generatePodcastImageFromTelegram,
  generatePodcastImageFromFile,
  generatePodcastImageFromUrl,
  listPodcastImagesGallery,
  GalleryImage
} from '@/lib/actions/podcast';
import { PODCAST_IMAGE_STYLES, VARIATION_OPTIONS } from '@/lib/constants/podcast-image-styles';
import type { ImageAnalysis } from '@/lib/services/podcast-image-enhancer';

interface ImageGenerationFieldProps {
  podcastId?: string;
  currentImageUrl?: string | null;
  telegramChannel?: string | null;
  podcastTitle?: string;
  savedImageStyle?: string | null; // The style ID saved in database
  onImageGenerated?: (imageUrl: string) => void;
}

type ImageSource = 'telegram' | 'upload' | 'url';

interface GeneratedVariation {
  url: string;
  index: number;
  selected: boolean;
}

interface GenerationDebugInfo {
  originalImageUrl?: string;
  analysis?: ImageAnalysis;
  prompt?: string;
}

/**
 * Enhanced component for generating podcast cover images with AI
 * Features:
 * - Multiple image sources (Telegram, file upload, URL)
 * - Style preset selection
 * - A/B testing with 1-3 variations
 * - Visual gallery for variation selection
 */
export function ImageGenerationField({
  podcastId,
  currentImageUrl,
  telegramChannel,
  podcastTitle = 'My Podcast',
  savedImageStyle,
  onImageGenerated
}: ImageGenerationFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource>('telegram');
  // Use saved style as default, or fall back to first style
  const [selectedStyle, setSelectedStyle] = useState(
    savedImageStyle && PODCAST_IMAGE_STYLES.find(s => s.id === savedImageStyle)
      ? savedImageStyle
      : PODCAST_IMAGE_STYLES[0].id
  );
  const [variationCount, setVariationCount] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
  const [debugInfo, setDebugInfo] = useState<GenerationDebugInfo | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      setUploadedFile(file);
      toast.success('Image uploaded successfully');
    }
  };

  /**
   * Convert File to base64 string
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!podcastId) {
      toast.error('Please save the podcast first');
      return;
    }

    // Validate based on source
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
      // Get selected style prompt modifier and ID
      const styleData = PODCAST_IMAGE_STYLES.find(s => s.id === selectedStyle);
      const stylePrompt = styleData?.promptModifier || 'modern, professional';

      const generationOptions = {
        style: stylePrompt,
        styleId: selectedStyle, // Save the style ID to database
        variationsCount: variationCount
      };

      let result;

      // Generate based on source
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
              podcastTitle,
              generationOptions
            );
          }
          break;

        case 'url':
          result = await generatePodcastImageFromUrl(
            podcastId,
            manualUrl,
            podcastTitle,
            generationOptions
          );
          break;
      }

      if (result?.success) {
        // Store debug info
        setDebugInfo({
          originalImageUrl: result.originalImageUrl,
          analysis: result.analysis,
          prompt: result.prompt
        });

        // Handle multiple variations if returned
        if (result.imageUrls && result.imageUrls.length > 1) {
          const variations: GeneratedVariation[] = result.imageUrls.map((url, index) => ({
            url,
            index,
            selected: index === 0 // First one selected by default
          }));

          setGeneratedVariations(variations);
          onImageGenerated?.(variations[0].url);

          const enhancementNote = result.enhancedWithAI ? ' (AI enhanced)' : '';
          toast.success(`Generated ${variations.length} variations${enhancementNote}! Select your favorite.`);
        } else if (result.imageUrl) {
          // Single variation
          const variations: GeneratedVariation[] = [{
            url: result.imageUrl,
            index: 0,
            selected: true
          }];

          setGeneratedVariations(variations);
          onImageGenerated?.(result.imageUrl);

          const enhancementNote = result.enhancedWithAI ? ' (AI enhanced)' : '';
          toast.success(`Image generated successfully${enhancementNote}!`);
        }
      } else {
        toast.error(result?.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = (index: number) => {
    const variations = generatedVariations.map((v, i) => ({
      ...v,
      selected: i === index
    }));
    setGeneratedVariations(variations);

    const selectedVariation = variations.find(v => v.selected);
    if (selectedVariation) {
      onImageGenerated?.(selectedVariation.url);
      toast.success('Image selected!');
    }
  };

  const handleLoadGallery = async () => {
    if (!podcastId) {
      toast.error('Please save the podcast first');
      return;
    }

    setIsLoadingGallery(true);
    try {
      const result = await listPodcastImagesGallery(podcastId);

      if (result.success && result.images) {
        setGalleryImages(result.images);
        setShowGallery(true);

        if (result.images.length === 0) {
          toast.info('No images found in gallery. Generate some images first!');
        } else {
          toast.success(`Found ${result.images.length} images in gallery`);
        }
      } else {
        toast.error(result.error || 'Failed to load gallery');
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleSelectFromGallery = (image: GalleryImage) => {
    onImageGenerated?.(image.url);
    setShowGallery(false);
    toast.success('Image selected from gallery!');
  };

  const selectedStyleData = PODCAST_IMAGE_STYLES.find(s => s.id === selectedStyle);
  const selectedVariationOption = VARIATION_OPTIONS.find(v => v.count === variationCount);

  // Show simple prompt if podcast not saved yet
  if (!podcastId) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          Save the podcast first to enable AI image generation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Image Preview */}
      {currentImageUrl && (
        <div className="space-y-2">
          <Label>Current Cover Image</Label>
          <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border">
            <Image
              src={currentImageUrl}
              alt="Current cover"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Image Source Selection */}
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
      </div>

      {/* File Upload (when selected) */}
      {imageSource === 'upload' && (
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
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

      {/* Manual URL Input (when selected) */}
      {imageSource === 'url' && (
        <div className="space-y-2">
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

      {/* Style Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="style-select">Image Style</Label>
          {savedImageStyle && selectedStyle === savedImageStyle && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Saved style
            </span>
          )}
        </div>
        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
          <SelectTrigger id="style-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PODCAST_IMAGE_STYLES.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.label}
                {savedImageStyle === style.id && ' ✓'}
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
        <RadioGroup value={String(variationCount)} onValueChange={(value) => setVariationCount(Number(value))}>
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

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating {variationCount > 1 ? `${variationCount} variations` : 'image'}...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI {selectedVariationOption && `(${selectedVariationOption.label})`}
            </>
          )}
        </Button>

        <Button
          type="button"
          onClick={handleLoadGallery}
          disabled={isLoadingGallery}
          variant="outline"
          className="flex-1"
        >
          {isLoadingGallery ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Images className="mr-2 h-4 w-4" />
              Browse Gallery
            </>
          )}
        </Button>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && (
        <div className="space-y-4 p-6 bg-muted/50 rounded-lg border-2 border-primary/30">
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
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No images found in gallery</p>
              <p className="text-sm text-muted-foreground mt-1">Generate some images first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
              {galleryImages.map((image) => (
                <Card
                  key={image.key}
                  className="cursor-pointer transition-all hover:ring-2 hover:ring-primary"
                  onClick={() => handleSelectFromGallery(image)}
                >
                  <CardContent className="p-0">
                    <div className="relative w-full aspect-square rounded-t-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`Gallery image`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="text-xs font-medium text-center capitalize">
                        {image.type}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {new Date(image.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Debug Info: Original Image, Analysis, Prompt */}
      {debugInfo && (
        <div className="space-y-6 mt-8 p-6 bg-muted/30 rounded-lg border">
          <h3 className="text-lg font-semibold">Generation Process Details</h3>

          {/* Original Image */}
          {debugInfo.originalImageUrl && (
            <div className="space-y-2">
              <Label className="text-base font-medium">1. Original Source Image</Label>
              <div className="relative w-full aspect-square max-w-sm rounded-lg overflow-hidden border bg-background">
                <Image
                  src={debugInfo.originalImageUrl}
                  alt="Original source"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="space-y-2">
            <Label className="text-base font-medium">2. AI Analysis of Source Image</Label>
            {debugInfo.analysis ? (
              <div className="space-y-3 text-sm bg-background p-4 rounded-md border">
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-muted-foreground">{debugInfo.analysis.description}</p>
                </div>
                <div>
                  <span className="font-semibold">Dominant Colors:</span>
                  <p className="mt-1 text-muted-foreground">{debugInfo.analysis.colors}</p>
                </div>
                <div>
                  <span className="font-semibold">Visual Style:</span>
                  <p className="mt-1 text-muted-foreground">{debugInfo.analysis.style}</p>
                </div>
                <div>
                  <span className="font-semibold">Main Elements:</span>
                  <p className="mt-1 text-muted-foreground">{debugInfo.analysis.mainElements}</p>
                </div>
                <div>
                  <span className="font-semibold">Mood:</span>
                  <p className="mt-1 text-muted-foreground">{debugInfo.analysis.mood}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-200">
                  ⚠️ Image analysis failed or was skipped. The AI will use a generic enhancement approach.
                  Check the console logs for details.
                </p>
              </div>
            )}
          </div>

          {/* Generation Prompt */}
          {debugInfo.prompt && (
            <div className="space-y-2">
              <Label className="text-base font-medium">3. Prompt Sent to Gemini 2.5 Flash Image (Nano Banana)</Label>
              <pre className="text-xs bg-background p-4 rounded-md border overflow-x-auto whitespace-pre-wrap font-mono">
                {debugInfo.prompt}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Generated Variations Gallery */}
      {generatedVariations.length > 0 && (
        <div className="space-y-3">
          <Label>Generated Variations - Select One</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedVariations.map((variation) => (
              <Card
                key={variation.index}
                className={`cursor-pointer transition-all ${
                  variation.selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted'
                }`}
                onClick={() => handleSelectVariation(variation.index)}
              >
                <CardContent className="p-0">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={variation.url}
                      alt={`Variation ${variation.index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {variation.selected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
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
    </div>
  );
}
