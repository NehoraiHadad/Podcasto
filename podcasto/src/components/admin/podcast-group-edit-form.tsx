'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { PodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups/types';
import { updatePodcastGroupAction, setPrimaryLanguageAction } from '@/lib/actions/podcast-group-actions';
import { getLanguageFlag, getLanguageName } from '@/lib/utils/language-utils';

const editGroupSchema = z.object({
  base_title: z.string().min(1, 'Title is required'),
  base_description: z.string().optional(),
  primary_language_code: z.string().min(1, 'Primary language is required'),
});

type EditGroupFormValues = z.infer<typeof editGroupSchema>;

interface PodcastGroupEditFormProps {
  podcastGroup: PodcastGroupWithLanguages;
}

/**
 * Podcast Group Edit Form Component
 *
 * Form for editing multilingual podcast group settings.
 * Allows updating base title, description, and setting primary language.
 */
export function PodcastGroupEditForm({ podcastGroup }: PodcastGroupEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPrimary = podcastGroup.languages.find(l => l.is_primary);

  const form = useForm<EditGroupFormValues>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      base_title: podcastGroup.base_title,
      base_description: podcastGroup.base_description || '',
      primary_language_code: currentPrimary?.language_code || podcastGroup.languages[0]?.language_code || '',
    },
  });

  const onSubmit = async (data: EditGroupFormValues) => {
    setIsSubmitting(true);

    try {
      // Check if primary language changed
      const primaryChanged = currentPrimary?.language_code !== data.primary_language_code;

      // Update base group data
      const updateResult = await updatePodcastGroupAction(podcastGroup.id, {
        base_title: data.base_title,
        base_description: data.base_description,
      });

      if (!updateResult.success) {
        toast.error(updateResult.error || 'Failed to update podcast group');
        return;
      }

      // Update primary language if changed
      if (primaryChanged) {
        const primaryResult = await setPrimaryLanguageAction(
          podcastGroup.id,
          data.primary_language_code
        );

        if (!primaryResult.success) {
          toast.error(primaryResult.error || 'Failed to update primary language');
          return;
        }
      }

      toast.success('Podcast group updated successfully');
      router.push('/admin/podcasts?view=groups');
      router.refresh();
    } catch (error) {
      console.error('Error updating podcast group:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Base Title */}
        <FormField
          control={form.control}
          name="base_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter group title" {...field} />
              </FormControl>
              <FormDescription>
                The base title for this podcast group (language-agnostic)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Base Description */}
        <FormField
          control={form.control}
          name="base_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter group description (optional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description for this podcast group
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary Language */}
        <FormField
          control={form.control}
          name="primary_language_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {podcastGroup.languages.map((lang) => (
                    <SelectItem key={lang.language_code} value={lang.language_code}>
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(lang.language_code)}</span>
                        <span>{lang.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({getLanguageName(lang.language_code)})
                        </span>
                        {lang.is_primary && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            Current Primary
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The primary language variant used as the default for this group
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language Variants Info */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <h4 className="text-sm font-semibold mb-3">Language Variants</h4>
          <div className="space-y-2">
            {podcastGroup.languages.map((lang) => (
              <div
                key={lang.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{getLanguageFlag(lang.language_code)}</span>
                  <span className="font-medium">{lang.title}</span>
                  {lang.is_primary && (
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {getLanguageName(lang.language_code)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            To add or remove language variants, manage the individual podcasts.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/podcasts?view=groups')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
