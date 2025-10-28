'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { languageFullToCode } from '@/lib/utils/language-mapper';

import {
  BasicInfoSection,
  ContentSourceSection,
  FormatSection,
  ScheduleSection,
  StyleSection,
  ImageUploadSection,
  AdminSettingsSection,
} from '../core';

import { editPodcastSchemaValidated } from '../shared/schemas';
import { podcastToFormValues, normalizeContentSource } from '../shared/transformers';

import type {
  PodcastEditFormProps,
  EditPodcastFormValues,
  PodcastFormat,
} from '../shared/types';

import { updatePodcast } from '@/lib/actions/podcast/update';

/**
 * Podcast Edit Form
 *
 * Universal edit form for existing podcasts. Adapts to user type (admin, premium, regular).
 * Allows format changes but warns if episodes exist.
 *
 * Features:
 * - Pre-filled with existing podcast data
 * - Format is EDITABLE (can switch between single/multi speaker)
 * - Warning shown if format changes and episodes exist
 * - Conditional admin fields based on userType
 * - Updates existing podcast instead of creating new one
 */
export function PodcastEditForm({
  podcast,
  episodeStats,
  userType,
  onSuccess,
  onCancel,
}: PodcastEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormatWarning, setShowFormatWarning] = useState(false);

  // Initialize form with existing podcast data using transformer
  const form = useForm<EditPodcastFormValues>({
    resolver: zodResolver(editPodcastSchemaValidated),
    defaultValues: podcastToFormValues(podcast),
  });

  // Track format changes
  const watchedFormat = form.watch('podcastFormat');
  const originalFormat = podcast.podcastFormat;

  useEffect(() => {
    // Show warning if format changed and episodes exist
    const formatChanged = watchedFormat !== originalFormat;
    const hasEpisodes = episodeStats && episodeStats.total > 0;
    setShowFormatWarning(Boolean(formatChanged && hasEpisodes));
  }, [watchedFormat, originalFormat, episodeStats]);

  const onSubmit = async (values: EditPodcastFormValues) => {
    setIsSubmitting(true);

    try {
      // Convert language from full name to ISO code
      const languageCode = languageFullToCode(values.language);

      // Transform form values to update payload
      const payload = {
        id: podcast.id,
        title: values.title,
        description: values.description || '',
        cover_image: values.cover_image || null,
        // Language (ISO code)
        languageCode,
        // Episode settings
        episodeFrequency: values.episodeFrequency,
        autoGeneration: values.autoGeneration,
        // Format and speakers
        podcastFormat: values.podcastFormat as PodcastFormat,
        speaker1Role: values.speaker1Role,
        speaker2Role: values.speaker2Role || null,
        conversationStyle: values.conversationStyle,
        introPrompt: values.introPrompt || null,
        outroPrompt: values.outroPrompt || null,
        // Content source
        contentSource: normalizeContentSource(values.contentSource),
        telegramChannel: values.contentSource === 'telegram' ? values.telegramChannelName : undefined,
        telegramHours: values.contentSource === 'telegram' ? values.telegramHours : undefined,
        urls: values.contentSource === 'rss' && values.rssUrl ? [values.rssUrl] : undefined,
        // Admin settings
        creator: values.creator,
        podcastName: values.podcastName,
        slogan: values.slogan || null,
        creativityLevel: values.creativityLevel,
        mixingTechniques: values.mixingTechniques,
        additionalInstructions: values.additionalInstructions || null,
      };

      // Call update action
      const result = await updatePodcast(payload);

      if (result.success) {
        toast.success('Podcast updated successfully');

        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect based on user type
          const redirectPath = userType === 'admin' ? '/admin/podcasts' : '/podcasts/my';
          router.push(redirectPath);
        }
      } else {
        toast.error(result.error || 'Failed to update podcast');
      }
    } catch (error) {
      console.error('[PodcastEditForm] Submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Format Change Warning */}
        {showFormatWarning && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Format Change Warning</AlertTitle>
            <AlertDescription>
              This podcast has {episodeStats?.total} episodes. Changing the format from{' '}
              <strong>{originalFormat}</strong> to <strong>{watchedFormat}</strong> may affect
              voice consistency in future episodes. Are you sure you want to proceed?
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <BasicInfoSection control={form.control} />

        {/* Content Source (Telegram/RSS) */}
        <ContentSourceSection control={form.control} />

        {/* Podcast Format (EDITABLE) */}
        <FormatSection control={form.control} setValue={form.setValue} />

        {/* Schedule & Automation */}
        <ScheduleSection control={form.control} />

        {/* Style & Customization (conditional for admin/premium) */}
        {(userType === 'admin' || userType === 'premium') && (
          <StyleSection control={form.control} />
        )}

        {/* Image Upload */}
        <ImageUploadSection control={form.control} />

        {/* Admin Settings (admin only) */}
        {userType === 'admin' && (
          <AdminSettingsSection control={form.control} />
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
                Updating...
              </>
            ) : (
              'Update Podcast'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
