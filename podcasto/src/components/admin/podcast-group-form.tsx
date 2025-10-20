'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Form } from '@/components/ui/form';
import type { PodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups/types';
import type { Podcast } from '@/lib/db/api/podcasts/types';
import { PodcastGroupBaseFields } from './podcast-group-form/base-fields';
import { LanguageVariantsList } from './podcast-group-form/language-variants-list';
import { podcastGroupSchema, type PodcastGroupFormValues } from './podcast-group-form/schema';
import {
  createPodcastGroupAction,
  updatePodcastGroupAction,
} from '@/lib/actions/podcast-group-actions';
import { Button } from '@/components/ui/button';

/**
 * Props for PodcastGroupForm component
 */
export interface PodcastGroupFormProps {
  mode: 'create' | 'edit';
  existingGroup?: PodcastGroupWithLanguages;
  availablePodcasts: Podcast[];
  onSuccess?: () => void;
}

/**
 * Podcast Group Form Component
 *
 * Form for creating or editing multilingual podcast groups.
 */
export function PodcastGroupForm({
  mode,
  existingGroup,
  availablePodcasts,
  onSuccess,
}: PodcastGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PodcastGroupFormValues>({
    resolver: zodResolver(podcastGroupSchema),
    defaultValues: mode === 'edit' && existingGroup
      ? {
          base_title: existingGroup.base_title,
          base_description: existingGroup.base_description || '',
          base_cover_image: existingGroup.base_cover_image || '',
          languages: existingGroup.languages.map((lang) => ({
            language_code: lang.language_code,
            podcast_id: lang.podcast_id,
            title: lang.title,
            description: lang.description || '',
            is_primary: lang.is_primary,
          })),
        }
      : {
          base_title: '',
          base_description: '',
          base_cover_image: '',
          languages: [],
        },
  });

  const onSubmit = async (data: PodcastGroupFormValues) => {
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const result = await createPodcastGroupAction(data);
        if (result.success) {
          toast.success('Podcast group created successfully');
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.error || 'Failed to create podcast group');
        }
      } else if (existingGroup) {
        const result = await updatePodcastGroupAction(existingGroup.id, {
          base_title: data.base_title,
          base_description: data.base_description,
          base_cover_image: data.base_cover_image,
        });
        if (result.success) {
          toast.success('Podcast group updated successfully');
          onSuccess?.();
        } else {
          toast.error(result.error || 'Failed to update podcast group');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PodcastGroupBaseFields control={form.control} />
        <LanguageVariantsList
          control={form.control}
          form={form}
          availablePodcasts={availablePodcasts}
        />
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create' ? 'Creating...' : 'Updating...'
              : mode === 'create' ? 'Create Podcast Group' : 'Update Podcast Group'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
