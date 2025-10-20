import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Control } from 'react-hook-form';
import type { PodcastGroupCreationFormValues } from './schema';

/**
 * Props for PodcastGroupCreationBaseFields component
 */
export interface PodcastGroupCreationBaseFieldsProps {
  control: Control<PodcastGroupCreationFormValues>;
  autoFilled?: boolean;
}

/**
 * Base Fields for Podcast Group Creation
 *
 * Displays the base group information fields (title, description, cover image)
 * When autoFilled=true, shows that fields are auto-populated from the first language
 */
export function PodcastGroupCreationBaseFields({ control, autoFilled = false }: PodcastGroupCreationBaseFieldsProps) {
  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div>
        <h3 className="text-lg font-semibold">
          {autoFilled ? 'Podcast Information' : 'Base Group Information'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {autoFilled
            ? 'These fields will auto-fill from your podcast details below.'
            : 'This information applies to the entire podcast group across all languages.'}
        </p>
      </div>

      <FormField
        control={control}
        name="base_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {autoFilled ? 'Title' : 'Base Title'}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={autoFilled ? 'Will auto-fill from podcast title' : 'Enter the base podcast group title'}
                readOnly={autoFilled}
                className={autoFilled ? 'bg-muted' : ''}
              />
            </FormControl>
            {autoFilled && (
              <FormDescription>
                Auto-filled from your podcast details
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="base_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {autoFilled ? 'Description' : 'Base Description'} (Optional)
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={autoFilled ? 'Will auto-fill from podcast description' : 'Enter a description for the podcast group'}
                rows={3}
                readOnly={autoFilled}
                className={autoFilled ? 'bg-muted' : ''}
              />
            </FormControl>
            {autoFilled && (
              <FormDescription>
                Auto-filled from your podcast details
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="base_cover_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {autoFilled ? 'Cover Image URL' : 'Base Cover Image URL'} (Optional)
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={autoFilled ? 'Will auto-fill from podcast cover image' : 'https://example.com/cover-image.jpg'}
                readOnly={autoFilled}
                className={autoFilled ? 'bg-muted' : ''}
              />
            </FormControl>
            {autoFilled && (
              <FormDescription>
                Auto-filled from your podcast details
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
