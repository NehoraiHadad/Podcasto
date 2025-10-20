import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Control } from 'react-hook-form';
import type { PodcastGroupCreationFormValues } from './schema';

/**
 * Props for PodcastGroupCreationBaseFields component
 */
export interface PodcastGroupCreationBaseFieldsProps {
  control: Control<PodcastGroupCreationFormValues>;
}

/**
 * Base Fields for Podcast Group Creation
 *
 * Displays the base group information fields (title, description, cover image)
 */
export function PodcastGroupCreationBaseFields({ control }: PodcastGroupCreationBaseFieldsProps) {
  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="text-lg font-semibold">Base Group Information</h3>
      <p className="text-sm text-muted-foreground">
        This information applies to the entire podcast group across all languages.
      </p>

      <FormField
        control={control}
        name="base_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Base Title</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter the base podcast group title" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="base_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Base Description (Optional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Enter a description for the podcast group"
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="base_cover_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Base Cover Image URL (Optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="https://example.com/cover-image.jpg"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
