'use client';

import { useState } from 'react';
import { Upload, Wand2, Save, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  generateEpisodeImagePreview,
  saveEpisodeImagePreview
} from '@/lib/actions/episode-actions';
import {
  LoadingButton,
  ImagePreviewCard,
  CurrentImageDisplay,
  imageToasts
} from '@/components/admin/shared/image-management';

interface EpisodeImageManagerProps {
  episodeId: string;
  podcastId: string | null;
  coverImage: string | null;
  episodeTitle: string | null;
}

export function EpisodeImageManager({ episodeId, podcastId, coverImage, episodeTitle }: EpisodeImageManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(coverImage);
  
  // New state for image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [episodeDescription, setEpisodeDescription] = useState<string | null>(null);
  const [generatedFromPrompt, setGeneratedFromPrompt] = useState<string | null>(null);

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      imageToasts.noFile();
      return;
    }

    if (!podcastId) {
      imageToasts.noPodcast();
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload the image
      const response = await fetch(`/api/episodes/${episodeId}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Update the current image
      setCurrentImage(result.imageUrl);
      setSelectedFile(null);
      imageToasts.uploadSuccess();
    } catch (error) {
      console.error('Error uploading image:', error);
      imageToasts.errorFromException(error, 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle AI image preview generation
  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setPreviewImage(null);
    setGeneratedFromPrompt(null);

    try {
      const result = await generateEpisodeImagePreview(episodeId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate image preview');
      }

      if (result.imageDataUrl) {
        setPreviewImage(result.imageDataUrl);
        setEpisodeDescription(result.episodeDescription || null);
        setGeneratedFromPrompt(result.generatedFromPrompt || null);
        imageToasts.generationSuccess();
      } else {
        imageToasts.noPreviewProduced();
      }
    } catch (error) {
      console.error('Error generating image preview:', error);
      imageToasts.errorFromException(error, 'Failed to generate image preview');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle saving the preview image
  const handleSavePreview = async () => {
    if (!previewImage) {
      imageToasts.noPreview();
      return;
    }

    setIsSavingPreview(true);

    try {
      const result = await saveEpisodeImagePreview(episodeId, previewImage);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save image');
      }

      if (result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setPreviewImage(null); // Clear the preview
        setGeneratedFromPrompt(null);
        imageToasts.saveSuccess();
      } else {
        imageToasts.noUrlReturned();
      }
    } catch (error) {
      console.error('Error saving image:', error);
      imageToasts.errorFromException(error, 'Failed to save image');
    } finally {
      setIsSavingPreview(false);
    }
  };

  // Handle discarding the preview
  const handleDiscardPreview = () => {
    setPreviewImage(null);
    setGeneratedFromPrompt(null);
    imageToasts.previewDiscarded();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Episode Cover Image</h3>

        {currentImage && !previewImage && (
          <CurrentImageDisplay
            imageUrl={currentImage}
            alt={`${episodeTitle || 'Episode'} cover`}
            label="Current Episode Cover"
            showViewLink
          />
        )}
        
        {/* Preview image with save/discard options */}
        {previewImage && (
          <ImagePreviewCard
            imageUrl={previewImage}
            alt="AI generated preview"
            description={episodeDescription}
            prompt={generatedFromPrompt}
            actions={
              <>
                <LoadingButton
                  isLoading={isSavingPreview}
                  loadingText="Saving..."
                  idleText="Save Image"
                  idleIcon={<Save className="mr-2 h-4 w-4" />}
                  onClick={handleSavePreview}
                  className="flex-1"
                />

                <Button
                  onClick={handleDiscardPreview}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Discard
                </Button>
              </>
            }
          />
        )}

        {!previewImage && (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                <span>Generate Image</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 mt-4">
              <FileUpload
                onFileChange={setSelectedFile}
                accept="image/*"
                buttonText="Select Image"
                disabled={isUploading}
              />

              <LoadingButton
                isLoading={isUploading}
                loadingText="Uploading..."
                idleText="Upload Image"
                onClick={handleUpload}
                disabled={!selectedFile}
                className="w-full"
              />
            </TabsContent>

            <TabsContent value="generate" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Generate a new cover image using AI based on the episode's description.
              </p>

              <LoadingButton
                isLoading={isGenerating}
                loadingText="Generating Preview..."
                idleText="Generate Preview"
                onClick={handleGeneratePreview}
                className="w-full"
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 