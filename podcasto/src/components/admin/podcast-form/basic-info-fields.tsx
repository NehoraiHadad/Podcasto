'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { FormLabel } from '@/components/ui/form';
import { FormTextField, FormTextareaField } from '@/components/ui/form-fields';
import { ImageGenerationField } from './image-generation';
import { TooltipLabel } from '@/components/ui/tooltip-label';
import { CharacterCounter } from '@/components/ui/character-counter';

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
  const description = form.watch('description' as Path<T>) as string | undefined;

  return (
    <>
      <div className="space-y-2">
        <TooltipLabel
          label="Podcast Title"
          tooltip="This is the public display name of your podcast. It will be shown to all listeners in podcast apps and on your podcast page."
          required
        />
        <FormTextField
          control={form.control}
          name={"title" as const as Path<T>}
          label=""
          placeholder="My Awesome Tech Podcast"
          description="The public name that listeners will see"
        />
      </div>

      <div className="space-y-2">
        <TooltipLabel
          label="Creator Name"
          tooltip="Your name or the name of your organization. This helps listeners know who is behind the podcast."
          required
        />
        <FormTextField
          control={form.control}
          name={"creator" as const as Path<T>}
          label=""
          placeholder="John Doe"
          description="Your name or organization name"
        />
      </div>

      <div className="space-y-2">
        <TooltipLabel
          label="Description"
          tooltip="A detailed description of your podcast. This helps potential listeners decide if your podcast is right for them. Aim for 50-200 characters for best results."
          required
        />
        <FormTextareaField
          control={form.control}
          name={"description" as const as Path<T>}
          label=""
          placeholder="Join me as I explore the latest trends in technology, interviewing experts and breaking down complex topics into easy-to-understand conversations."
          className="min-h-24 md:min-h-32"
        />
        <CharacterCounter
          current={description?.length || 0}
          min={10}
          max={1000}
          recommended={{ min: 50, max: 200 }}
        />
      </div>
      
      <div className="space-y-4">
        <TooltipLabel
          label="Cover Image"
          tooltip="Your podcast's cover art. You can generate it using AI based on your podcast content, or provide your own image URL."
        />

        {/* AI-Powered Image Generation */}
        <ImageGenerationField
          podcastId={podcastId}
          currentImageUrl={currentCoverImage}
          telegramChannel={telegramChannel}
          podcastTitle={podcastTitle}
          savedImageStyle={savedImageStyle}
          onImageGenerated={(imageUrl) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.setValue('cover_image' as Path<T>, imageUrl as any);
          }}
        />

        {/* Manual URL Input (Optional) */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Or provide your own image URL:</p>
          <FormTextField
            control={form.control}
            name={"cover_image" as const as Path<T>}
            label=""
            type="url"
            placeholder="https://example.com/podcast-cover.jpg"
            description="Direct URL to your podcast cover image (recommended: 1400x1400px)"
          />
        </div>
      </div>
    </>
  );
} 