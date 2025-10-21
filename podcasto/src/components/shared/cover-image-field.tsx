'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface CoverImageFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Reusable Cover Image Field Component
 *
 * A form field for entering a cover image URL with validation.
 * Can be used in any form that needs cover image input.
 *
 * @example
 * ```tsx
 * <CoverImageField
 *   control={form.control}
 *   name="coverImage"
 *   label="Podcast Cover Image"
 *   description="Optional: Provide a URL or leave empty to use Telegram channel photo."
 * />
 * ```
 */
export function CoverImageField<TFieldValues extends FieldValues>({
  control,
  name,
  label = 'Cover Image URL',
  description = 'Optional: Provide a cover image URL. Leave empty to use the default image.',
  placeholder = 'https://example.com/image.jpg',
  required = false,
}: CoverImageFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="url"
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
