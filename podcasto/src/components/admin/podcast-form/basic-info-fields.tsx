'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FormValues {
  title?: string;
  creator?: string;
  description?: string;
  cover_image?: string;
  [key: string]: unknown;
}

interface BasicInfoFieldsProps<T extends FormValues> {
  form: UseFormReturn<T>;
}

export function BasicInfoFields<T extends FormValues>({ form }: BasicInfoFieldsProps<T>) {
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
      
      <FormField
        control={form.control}
        name={"cover_image" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover Image URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/image.jpg" {...field} value={String(field.value || '')} />
            </FormControl>
            <FormDescription className="text-xs">
              A URL to the cover image for your podcast
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
} 