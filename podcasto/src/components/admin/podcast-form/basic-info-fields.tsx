'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageGenerationField } from './image-generation-field';

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
      <FormField
        control={form.control}
        name={"title" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter podcast title" {...field} value={String(field.value || '')} />
            </FormControl>
            <FormDescription className="text-xs">
              The name of your podcast as shown to listeners
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name={"creator" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Creator</FormLabel>
            <FormControl>
              <Input placeholder="Enter creator name" {...field} value={String(field.value || '')} />
            </FormControl>
            <FormDescription className="text-xs">
              The name of the podcast creator
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name={"description" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your podcast"
                className="min-h-24 md:min-h-32 resize-y"
                {...field}
                value={String(field.value || '')}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Provide details about what listeners can expect from your podcast
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
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
        <FormField
          control={form.control}
          name={"cover_image" as const as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-gray-600">Or enter URL manually:</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  {...field}
                  value={String(field.value || '')}
                />
              </FormControl>
              <FormDescription className="text-xs">
                You can also paste a direct URL to an image
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
} 