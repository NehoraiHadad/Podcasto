import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Control } from 'react-hook-form';
import type { PodcastGroupFormValues } from './schema';

/**
 * Props for PodcastGroupBaseFields component
 */
export interface PodcastGroupBaseFieldsProps {
  control: Control<PodcastGroupFormValues>;
}

/**
 * Base Fields Component
 *
 * Renders the base information fields for a podcast group.
 */
export function PodcastGroupBaseFields({ control }: PodcastGroupBaseFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Base Information</CardTitle>
        <CardDescription>
          Core details shared across all language variants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="base_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Title</FormLabel>
              <FormControl>
                <Input placeholder="My Podcast Group" {...field} />
              </FormControl>
              <FormDescription>
                This will be used as fallback for all language variants
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="base_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description shared across all variants..."
                  {...field}
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
              <FormLabel>Base Cover Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
