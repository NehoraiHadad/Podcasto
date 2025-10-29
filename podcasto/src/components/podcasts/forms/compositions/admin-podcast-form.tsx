'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormErrorSummary, formatFormErrors } from '@/components/ui/form-error-summary';
import { toast } from 'sonner';

import {
  LanguageVariantCard,
  BaseGroupSection,
} from '../core';

import {
  podcastGroupCreationSchema,
  defaultPodcastGroupValues,
  defaultLanguageVariantValues,
} from '../shared/schemas';

import type {
  AdminPodcastFormProps,
  PodcastGroupCreationFormValues,
} from '../shared/types';

import { normalizeContentSource } from '../shared/transformers';

import { createPodcastGroupWithNewPodcastsAction } from '@/lib/actions/podcast-group-actions';

/**
 * Admin Podcast Form
 *
 * Full-featured admin form for creating podcasts with complete customization.
 * Supports both single-language and multi-language podcast creation.
 *
 * Features:
 * - Single-language mode: Creates one podcast with auto-filled group fields
 * - Multi-language mode: Creates a podcast group with multiple language variants
 * - All form sections (basic info, content, format, schedule, style, image)
 * - Admin-only fields (creator, technical name, slogan, creativity, mixing)
 * - Language variant management (add/remove languages, set primary)
 * - Auto-sync base fields from first language in single-language mode
 */
export function AdminPodcastForm({
  mode,
  onSuccess,
  onCancel,
}: AdminPodcastFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with podcast group schema
  const form = useForm<PodcastGroupCreationFormValues>({
    resolver: zodResolver(podcastGroupCreationSchema),
    defaultValues: defaultPodcastGroupValues,
  });

  // Field array for language variants
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'languages',
  });

  // Watch for changes
  const languages = form.watch('languages');
  const languageCount = languages?.length || 1;
  const firstLangTitle = form.watch('languages.0.title');
  const firstLangDescription = form.watch('languages.0.description');
  const firstLangCoverImage = form.watch('languages.0.cover_image');

  // Determine if we're in single-language or multi-language mode
  const isSingleLanguageMode = languageCount === 1;

  // Auto-sync base fields from first language in single-language mode
  useEffect(() => {
    if (isSingleLanguageMode) {
      form.setValue('base_title', firstLangTitle || '', { shouldValidate: true });
      form.setValue('base_description', firstLangDescription || '', { shouldValidate: true });
      form.setValue('base_cover_image', firstLangCoverImage || '', { shouldValidate: true });
    }
  }, [isSingleLanguageMode, firstLangTitle, firstLangDescription, firstLangCoverImage, form]);

  // Add a new language variant
  const addLanguageVariant = () => {
    append({
      ...defaultLanguageVariantValues,
      is_primary: false,
    });
  };

  // Remove a language variant
  const removeLanguageVariant = (index: number) => {
    if (languageCount === 1) {
      toast.error('Cannot remove the last language variant');
      return;
    }

    const removedLang = languages[index];

    // If removing the primary language, make the first remaining one primary
    if (removedLang.is_primary && languageCount > 1) {
      const newPrimaryIndex = index === 0 ? 1 : 0;
      form.setValue(`languages.${newPrimaryIndex}.is_primary`, true);
    }

    remove(index);
  };

  // Set a language variant as primary
  const setPrimaryLanguage = (index: number) => {
    // Unset all other primary flags
    languages.forEach((_, i) => {
      form.setValue(`languages.${i}.is_primary`, i === index);
    });
  };

  const onSubmit = async (values: PodcastGroupCreationFormValues) => {
    setIsSubmitting(true);

    try {
      console.log('[AdminPodcastForm] Submitting data:', values);

      // Transform form values to server action format
      const payload = {
        base_title: values.base_title,
        base_description: values.base_description || '',
        base_cover_image: values.base_cover_image || '',
        languages: values.languages.map((lang) => ({
          language_code: lang.language_code,
          is_primary: lang.is_primary,
          title: lang.title,
          description: lang.description || '',
          cover_image: lang.cover_image || '',
          image_style: lang.image_style || '',
          contentSource: normalizeContentSource(lang.contentSource),
          telegramChannel: lang.contentSource === 'telegram' ? lang.telegramChannelName : undefined,
          telegramHours: lang.contentSource === 'telegram' ? lang.telegramHours : undefined,
          urls: lang.contentSource === 'rss' && lang.rssUrl ? [lang.rssUrl] : undefined,
          creator: lang.creator,
          podcastName: lang.podcastName,
          outputLanguage: lang.language,
          slogan: lang.slogan || undefined,
          creativityLevel: lang.creativityLevel,
          episodeFrequency: lang.episodeFrequency,
          podcastFormat: lang.podcastFormat,
          conversationStyle: lang.conversationStyle,
          speaker1Role: lang.speaker1Role,
          speaker2Role: lang.speaker2Role || undefined,
          mixingTechniques: lang.mixingTechniques,
          additionalInstructions: lang.additionalInstructions || undefined,
        })),
      };

      // Call server action
      const result = await createPodcastGroupWithNewPodcastsAction(payload);

      if (result.success) {
        const variantCount = values.languages.length;
        toast.success(
          variantCount === 1
            ? 'Podcast created successfully'
            : `Podcast group created successfully with ${variantCount} language variants`
        );

        if (onSuccess && result.data?.languages?.[0]?.podcast_id) {
          onSuccess(result.data.languages[0].podcast_id);
        }

        // Redirect to admin podcasts page
        router.push('/admin/podcasts');
      } else {
        toast.error(result.error || 'Failed to create podcast');
      }
    } catch (error) {
      console.error('[AdminPodcastForm] Submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Base Group Section */}
        <BaseGroupSection
          control={form.control}
          autoFilled={isSingleLanguageMode}
          languageCount={languageCount}
        />

        {/* Language Variants Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {isSingleLanguageMode ? 'Podcast Configuration' : `Language Variants (${languageCount})`}
                </CardTitle>
                {!isSingleLanguageMode && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Each variant represents a complete podcast in a different language
                  </p>
                )}
              </div>
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
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <LanguageVariantCard
                key={field.id}
                index={index}
                control={form.control}
                form={form}
                onRemove={() => removeLanguageVariant(index)}
                onSetPrimary={() => setPrimaryLanguage(index)}
                canRemove={languageCount > 1}
                isPrimary={languages[index]?.is_primary || false}
                showLanguageControls={!isSingleLanguageMode}
              />
            ))}
          </CardContent>
        </Card>

        {/* Form Validation Errors */}
        {Object.keys(form.formState.errors).length > 0 && (
          <FormErrorSummary errors={formatFormErrors(form.formState.errors)} />
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                {mode === 'create' ? 'Create' : 'Update'}{' '}
                {isSingleLanguageMode ? 'Podcast' : `Podcast Group (${languageCount} variants)`}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
