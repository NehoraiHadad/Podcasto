'use client';

import { Control, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { FormTextField } from '@/components/ui/form-fields';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadSectionProps {
  control: Control<any>;
  disabled?: boolean;
  onAiGenerate?: () => void;
}

/**
 * Image upload section with preview and AI generation option.
 * Supports both file upload and direct URL input.
 *
 * Fields:
 * - coverImage: URL to the podcast cover image
 *
 * Features:
 * - Image preview when URL is provided
 * - File upload button (placeholder for future implementation)
 * - AI generation button (calls optional onAiGenerate callback)
 */
export function ImageUploadSection({
  control,
  disabled = false,
  onAiGenerate,
}: ImageUploadSectionProps) {
  const [uploadError, setUploadError] = useState<string>('');
  const coverImage = useWatch({ control, name: 'coverImage' });

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

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="coverImage"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Cover Image</FormLabel>

            {coverImage && (
              <div className="relative w-full max-w-xs h-48 rounded-lg overflow-hidden border">
                <Image
                  src={coverImage}
                  alt="Podcast cover preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

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

              <Button
                type="button"
                variant="outline"
                disabled={disabled || !onAiGenerate}
                onClick={onAiGenerate}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </div>

            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}

            <FormMessage />
          </FormItem>
        )}
      />

      <FormTextField
        control={control}
        name="coverImage"
        label="Or paste image URL"
        type="url"
        placeholder="https://example.com/podcast-cover.jpg"
        description="Direct URL to your podcast cover image (recommended: 1400x1400px)"
        disabled={disabled}
      />

      <input
        type="file"
        id="image-upload"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        disabled={disabled}
      />
    </div>
  );
}
