import { Trash2 } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Control } from 'react-hook-form';
import type { Podcast } from '@/lib/db/api/podcasts/types';
import type { PodcastGroupFormValues } from './schema';
import { LanguageSelector } from '../language-selector';

/**
 * Props for LanguageVariantCard component
 */
export interface LanguageVariantCardProps {
  index: number;
  control: Control<PodcastGroupFormValues>;
  availablePodcasts: Podcast[];
  onRemove: () => void;
}

/**
 * Language Variant Card Component
 *
 * Form fields for a single language variant.
 */
export function LanguageVariantCard({
  index,
  control,
  availablePodcasts,
  onRemove,
}: LanguageVariantCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Variant {index + 1}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label="Remove language variant"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={`languages.${index}.language_code`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <FormControl>
                <LanguageSelector
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select language"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`languages.${index}.podcast_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Podcast</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select podcast" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availablePodcasts.map((podcast) => (
                    <SelectItem key={podcast.id} value={podcast.id}>
                      {podcast.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`languages.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Language-specific title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`languages.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Language-specific description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`languages.${index}.is_primary`}
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Primary language variant</FormLabel>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
