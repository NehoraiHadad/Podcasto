'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormValues } from './types';

interface MetadataTabClientProps {
  form: UseFormReturn<FormValues>;
}

export function MetadataTabClient({ form }: MetadataTabClientProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Title
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter podcast title" 
                {...field} 
                className={form.formState.errors.title ? 'border-red-500' : ''}
              />
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="creator"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Creator
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter creator name" 
                {...field}
                className={form.formState.errors.creator ? 'border-red-500' : ''}
              />
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Description
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter podcast description" 
                className={`min-h-[100px] ${form.formState.errors.description ? 'border-red-500' : ''}`}
                {...field} 
              />
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="coverImage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover Image</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter cover image URL" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Optional - A default placeholder image is provided (picsum.photos/400/300)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
} 