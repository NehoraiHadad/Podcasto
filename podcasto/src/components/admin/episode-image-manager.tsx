'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, Wand2, RefreshCw, Save, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  generateEpisodeImagePreview, 
  saveEpisodeImagePreview 
} from '@/lib/actions/episode-actions';

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
      toast.error('Please select an image file first');
      return;
    }

    if (!podcastId) {
      toast.error('Episode has no associated podcast');
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
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
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
        toast.success('Image preview generated successfully');
      } else {
        toast.warning('Image generation completed but no preview was produced');
      }
    } catch (error) {
      console.error('Error generating image preview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image preview');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle saving the preview image
  const handleSavePreview = async () => {
    if (!previewImage) {
      toast.error('No preview image to save');
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
        toast.success('Image saved successfully');
      } else {
        toast.warning('Image saving completed but no URL was returned');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save image');
    } finally {
      setIsSavingPreview(false);
    }
  };

  // Handle discarding the preview
  const handleDiscardPreview = () => {
    setPreviewImage(null);
    setGeneratedFromPrompt(null);
    toast.info('Preview discarded');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-medium">Episode Cover Image</h3>

        {currentImage && !previewImage && (
          <div className="space-y-2">
            <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md">
              <Image
                src={currentImage}
                alt={`${episodeTitle || 'Episode'} cover`}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-2">
              <a
                href={currentImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Full Image
              </a>
            </div>
          </div>
        )}
        
        {/* Preview image with save/discard options */}
        {previewImage && (
          <div className="space-y-4">
            <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md">
              <Image
                src={previewImage}
                alt="AI generated preview"
                fill
                className="object-cover"
              />
            </div>
            
            {episodeDescription && (
              <div className="text-sm text-muted-foreground mt-2 max-h-24 overflow-auto">
                <p className="font-semibold">Source description:</p>
                <p className="italic">{episodeDescription.substring(0, 200)}
                  {episodeDescription.length > 200 ? '...' : ''}
                </p>
              </div>
            )}
            
            {generatedFromPrompt && (
              <div className="text-sm text-muted-foreground mt-2 max-h-80 overflow-auto border-t border-dashed border-gray-300 pt-2">
                <p className="font-semibold text-xs uppercase tracking-wide">AI prompt used:</p>
                <div className="mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
                  <p className="whitespace-pre-wrap text-xs font-mono">{generatedFromPrompt}</p>
                </div>
                <div className="text-right mt-1">
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedFromPrompt)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Copy to clipboard
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleSavePreview}
                disabled={isSavingPreview}
                className="flex-1"
              >
                {isSavingPreview ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Image
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDiscardPreview}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </div>
          </div>
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
              
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="generate" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Generate a new cover image using AI based on the episode's description.
              </p>
              
              <Button 
                onClick={handleGeneratePreview}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  'Generate Preview'
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 