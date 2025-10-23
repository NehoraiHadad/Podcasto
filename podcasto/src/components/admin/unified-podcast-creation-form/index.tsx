'use client';

import { useState, useEffect, useMemo } from 'react';
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
 * Unified Podcast Creation Form
 *
 * This form ALWAYS creates podcasts as part of a podcast group.
 * It defaults to a single language variant with smart auto-fill for group fields.
 *
 * Smart Defaults:
 * - Starts with 1 language variant (first one is always primary)
 * - Group title/description auto-fill from first language if only 1 variant
 * - User can add more languages as needed
 * - Group fields become editable when 2+ languages exist
 */
export function UnifiedPodcastCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PodcastGroupCreationFormValues>({
    resolver: zodResolver(podcastGroupCreationSchema),
    defaultValues: {
      base_title: '',
      base_description: '',
      base_cover_image: '',
      languages: [
        // Start with one language variant by default
        {
          language_code: '',
          is_primary: true, // First language is always primary
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
          episodeFrequency: 7,
          conversationStyle: 'engaging' as const,
          speaker1Role: 'host' as const,
          speaker2Role: 'expert' as const,
          mixingTechniques: ['rhetorical-questions', 'personal-anecdotes'],
          additionalInstructions: '',
        },
      ],
    },
  });

  const watchedLanguages = form.watch('languages');
  const languages = useMemo(() => watchedLanguages || [], [watchedLanguages]);
  const languageCount = languages.length;

  // Auto-fill group fields from first language when there's only 1 variant
  useEffect(() => {
    if (languageCount === 1) {
      const firstLang = languages[0];
      // Always sync title, description, and cover_image - even if empty
      // This ensures the base fields are always in sync with the variant
      form.setValue('base_title', firstLang.title || '', { shouldValidate: true });
      form.setValue('base_description', firstLang.description || '', { shouldValidate: true });
      form.setValue('base_cover_image', firstLang.cover_image || '', { shouldValidate: true });
    }
  }, [languageCount, languages, form]);

  const addLanguageVariant = () => {
    const currentLanguages = form.getValues('languages');
    form.setValue('languages', [
      ...currentLanguages,
      {
        language_code: '',
        is_primary: false, // Only first language is primary
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

    // Don't allow removing the last language
    if (currentLanguages.length === 1) {
      toast.error('Cannot remove the last language variant');
      return;
    }

    // If removing the primary language, make the first remaining one primary
    const removedLang = currentLanguages[index];
    const updatedLanguages = currentLanguages.filter((_, i) => i !== index);

    if (removedLang.is_primary && updatedLanguages.length > 0) {
      updatedLanguages[0].is_primary = true;
    }

    form.setValue('languages', updatedLanguages);
  };

  const onSubmit = async (data: PodcastGroupCreationFormValues) => {
    setIsSubmitting(true);

    try {
      console.log('[UnifiedPodcastCreationForm] Submitting data:', data);

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
          episodeFrequency: lang.episodeFrequency,
          conversationStyle: lang.conversationStyle,
          speaker1Role: lang.speaker1Role,
          speaker2Role: lang.speaker2Role,
          mixingTechniques: lang.mixingTechniques,
          additionalInstructions: lang.additionalInstructions,
        })),
      });

      if (result.success) {
        const variantCount = data.languages.length;
        toast.success(
          variantCount === 1
            ? 'Podcast created successfully'
            : `Podcast group created successfully with ${variantCount} language variants`
        );
        form.reset();
        router.push('/admin/podcasts');
      } else {
        toast.error(result.error || 'Failed to create podcast');
      }
    } catch (error) {
      console.error('[UnifiedPodcastCreationForm] Error:', error);
      toast.error('An unexpected error occurred while creating the podcast');
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
          <AlertTitle>
            {languageCount === 1 ? 'Creating a Single-Language Podcast' : 'Creating a Multilingual Podcast Group'}
          </AlertTitle>
          <AlertDescription>
            {languageCount === 1 ? (
              <>
                You are creating a podcast with one language. Group fields will auto-fill from your podcast details.
                Add more languages below to create a multilingual podcast group.
              </>
            ) : (
              <>
                You are creating {languageCount} language variants in one flow.
                Each variant will be a complete podcast with its own configuration.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Base Group Fields - Show differently based on language count */}
        <PodcastGroupCreationBaseFields
          control={form.control}
          autoFilled={languageCount === 1}
        />

        {/* Language Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {languageCount === 1 ? 'Podcast Details' : `Language Variants (${languageCount})`}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLanguageVariant}
              aria-label="Add language variant"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          </div>

          {languages.map((_, index) => (
            <LanguageVariantCreationCard
              key={index}
              index={index}
              control={form.control}
              form={form}
              onRemove={() => removeLanguageVariant(index)}
              canRemove={languageCount > 1}
              showLanguageLabel={languageCount > 1}
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Creating...'
              : languageCount === 1
              ? 'Create Podcast'
              : `Create Podcast Group (${languageCount} variants)`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
