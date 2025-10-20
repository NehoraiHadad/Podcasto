'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { PodcastGroupCreationBaseFields } from './base-fields';
import { LanguageVariantCreationCard } from './language-variant-creation-card';
import { podcastGroupCreationSchema, type PodcastGroupCreationFormValues } from './schema';
import { createPodcastGroupWithNewPodcastsAction } from '@/lib/actions/podcast-group-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * Podcast Group Creation Form Component
 *
 * Form for creating a new podcast group with all language variants from scratch.
 * This is a single-flow creation that:
 * 1. Creates all individual podcasts with configs
 * 2. Creates the podcast group
 * 3. Links everything together
 */
export function PodcastGroupCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PodcastGroupCreationFormValues>({
    resolver: zodResolver(podcastGroupCreationSchema),
    defaultValues: {
      base_title: '',
      base_description: '',
      base_cover_image: '',
      languages: [],
    },
  });

  const languages = form.watch('languages') || [];

  const addLanguageVariant = () => {
    const currentLanguages = form.getValues('languages');
    form.setValue('languages', [
      ...currentLanguages,
      {
        language_code: '',
        is_primary: currentLanguages.length === 0,
        title: '',
        description: '',
        cover_image: '',
        image_style: '',
        contentSource: 'telegram' as const,
        telegramChannel: '',
        telegramHours: 24,
        urls: ['', '', '', '', ''],
        creator: '',
        podcastName: '',
        outputLanguage: 'english' as const,
        slogan: '',
        creativityLevel: 0.7,
        isLongPodcast: false,
        discussionRounds: 5,
        minCharsPerRound: 500,
        episodeFrequency: 7,
        conversationStyle: 'engaging' as const,
        speaker1Role: 'host' as const,
        speaker2Role: 'expert' as const,
        mixingTechniques: ['rhetorical-questions', 'personal-anecdotes'],
        additionalInstructions: '',
      },
    ]);
  };

  const removeLanguageVariant = (index: number) => {
    const currentLanguages = form.getValues('languages');
    form.setValue('languages', currentLanguages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PodcastGroupCreationFormValues) => {
    setIsSubmitting(true);

    try {
      console.log('[PodcastGroupCreationForm] Submitting data:', data);

      const result = await createPodcastGroupWithNewPodcastsAction({
        base_title: data.base_title,
        base_description: data.base_description,
        base_cover_image: data.base_cover_image,
        languages: data.languages.map((lang) => ({
          language_code: lang.language_code,
          is_primary: lang.is_primary,
          title: lang.title,
          description: lang.description,
          cover_image: lang.cover_image,
          image_style: lang.image_style,
          contentSource: lang.contentSource,
          telegramChannel: lang.telegramChannel,
          telegramHours: lang.telegramHours,
          urls: lang.urls?.filter((url): url is string => url !== undefined) || [],
          creator: lang.creator,
          podcastName: lang.podcastName,
          outputLanguage: lang.outputLanguage,
          slogan: lang.slogan,
          creativityLevel: lang.creativityLevel,
          isLongPodcast: lang.isLongPodcast,
          discussionRounds: lang.discussionRounds,
          minCharsPerRound: lang.minCharsPerRound,
          episodeFrequency: lang.episodeFrequency,
          conversationStyle: lang.conversationStyle,
          speaker1Role: lang.speaker1Role,
          speaker2Role: lang.speaker2Role,
          mixingTechniques: lang.mixingTechniques,
          additionalInstructions: lang.additionalInstructions,
        })),
      });

      if (result.success) {
        toast.success(`Podcast group created successfully with ${data.languages.length} language variant(s)`);
        form.reset();
        router.push('/admin/podcasts?view=groups');
      } else {
        toast.error(result.error || 'Failed to create podcast group');
      }
    } catch (error) {
      console.error('[PodcastGroupCreationForm] Error:', error);
      toast.error('An unexpected error occurred while creating the podcast group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Creating a Multilingual Podcast Group</AlertTitle>
          <AlertDescription>
            You are creating {languages.length > 0 ? languages.length : 'multiple'} language variant(s) in one flow.
            Each variant will be a complete podcast with its own configuration.
            {languages.length === 0 && " Click 'Add Language Variant' to get started."}
          </AlertDescription>
        </Alert>

        {/* Base Group Fields */}
        <PodcastGroupCreationBaseFields control={form.control} />

        {/* Language Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Language Variants</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLanguageVariant}
              aria-label="Add language variant"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Language Variant
            </Button>
          </div>

          {languages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No language variants added. Click "Add Language Variant" to create your first podcast.
            </p>
          )}

          {languages.map((_, index) => (
            <LanguageVariantCreationCard
              key={index}
              index={index}
              control={form.control}
              onRemove={() => removeLanguageVariant(index)}
            />
          ))}
        </div>

        {/* Form Validation Errors */}
        {Object.keys(form.formState.errors).length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside">
                {Object.entries(form.formState.errors).map(([key, error]) => (
                  <li key={key}>
                    {key}: {error?.message?.toString() || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || languages.length === 0}>
            {isSubmitting
              ? 'Creating...'
              : `Create Podcast Group ${languages.length > 0 ? `(${languages.length} variant${languages.length > 1 ? 's' : ''})` : ''}`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
