'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { FormLabel } from '@/components/ui/form';
import { FormTextField, FormTextareaField } from '@/components/ui/form-fields';
import { ImageGenerationField } from './image-generation';

interface FormValues {
  title?: string;
  creator?: string;
  description?: string;
  cover_image?: string;
  image_style?: string;
  [key: string]: unknown;
}

interface BasicInfoFieldsProps<T extends FormValues> {
  form: UseFormReturn<T>;
  podcastId?: string;
  telegramChannel?: string | null;
}

export function BasicInfoFields<T extends FormValues>({ form, podcastId, telegramChannel }: BasicInfoFieldsProps<T>) {
  const currentCoverImage = form.watch('cover_image' as Path<T>) as string | undefined;
  const podcastTitle = form.watch('title' as Path<T>) as string | undefined;
  const savedImageStyle = form.watch('image_style' as Path<T>) as string | undefined;

  return (
    <>
      <FormTextField
        control={form.control}
        name={"title" as const as Path<T>}
        label="Title"
        placeholder="Enter podcast title"
        description="The name of your podcast as shown to listeners"
      />

      <FormTextField
        control={form.control}
        name={"creator" as const as Path<T>}
        label="Creator"
        placeholder="Enter creator name"
        description="The name of the podcast creator"
      />

      <FormTextareaField
        control={form.control}
        name={"description" as const as Path<T>}
        label="Description"
        placeholder="Describe your podcast"
        className="min-h-24 md:min-h-32"
        description="Provide details about what listeners can expect from your podcast"
      />
      
      <div className="space-y-4">
        <FormLabel>Cover Image</FormLabel>

        {/* AI-Powered Image Generation */}
        <ImageGenerationField
          podcastId={podcastId}
          currentImageUrl={currentCoverImage}
          telegramChannel={telegramChannel}
          podcastTitle={podcastTitle}
          savedImageStyle={savedImageStyle}
          onImageGenerated={(imageUrl) => {
            form.setValue('cover_image' as Path<T>, imageUrl as any);
          }}
        />

        {/* Manual URL Input (Optional) */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Or enter URL manually:</p>
          <FormTextField
            control={form.control}
            name={"cover_image" as const as Path<T>}
            label=""
            type="url"
            placeholder="https://example.com/image.jpg"
            description="You can also paste a direct URL to an image"
          />
        </div>
      </div>
    </>
  );
} 