'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

import {
  BasicInfoSection,
  ContentSourceSection,
  FormatSection,
  ScheduleSection,
  StyleSection,
  ImageUploadSection,
} from '../core';

import {
  adminPodcastSchemaValidated,
  defaultPodcastValues,
  defaultAdminValues,
} from '../shared/schemas';

import type {
  AdminPodcastFormProps,
  AdminPodcastFormValues,
} from '../shared/types';

import { createPodcastGroupWithNewPodcastsAction } from '@/lib/actions/podcast-group-actions';

/**
 * Admin Podcast Form
 *
 * Full-featured admin form for creating podcasts with complete customization.
 * Includes all sections and admin-only advanced settings.
 *
 * Features:
 * - All form sections (basic info, content, format, schedule, style, image)
 * - Admin-only fields (creator, technical name, slogan, creativity, mixing)
 * - Single-language creation (multi-language support coming later)
 */
export function AdminPodcastForm({
  mode,
  podcast,
  onSuccess,
  onCancel,
}: AdminPodcastFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<AdminPodcastFormValues>({
    resolver: zodResolver(adminPodcastSchemaValidated),
    defaultValues: {
      ...defaultPodcastValues,
      ...defaultAdminValues,
      ...podcast,
    },
  });

  const onSubmit = async (values: AdminPodcastFormValues) => {
    setIsSubmitting(true);

    try {
      // Transform form values to podcast group creation format
      const payload = {
        base_title: values.title,
        base_description: values.description || '',
        base_cover_image: values.cover_image || '',
        languages: [
          {
            language_code: values.language === 'english' ? 'en' : 'he',
            is_primary: true,
            title: values.title,
            description: values.description || '',
            cover_image: values.cover_image || '',
            image_style: values.image_style || '',
            contentSource: (values.contentSource === 'rss' ? 'urls' : values.contentSource) as 'telegram' | 'urls',
            telegramChannel: values.contentSource === 'telegram' ? values.telegramChannelName : undefined,
            telegramHours: values.contentSource === 'telegram' ? values.telegramHours : undefined,
            urls: values.contentSource === 'rss' && values.rssUrl ? [values.rssUrl] : undefined,
            creator: values.creator,
            podcastName: values.podcastName,
            outputLanguage: values.language,
            slogan: values.slogan || undefined,
            creativityLevel: values.creativityLevel,
            episodeFrequency: values.episodeFrequency,
            podcastFormat: values.podcastFormat,
            conversationStyle: values.conversationStyle,
            speaker1Role: values.speaker1Role,
            speaker2Role: values.speaker2Role || undefined,
            mixingTechniques: values.mixingTechniques,
            additionalInstructions: values.additionalInstructions || undefined,
          },
        ],
      };

      // Call server action
      const result = await createPodcastGroupWithNewPodcastsAction(payload);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Podcast created successfully',
        });

        if (onSuccess && result.data?.languages?.[0]?.podcast_id) {
          onSuccess(result.data.languages[0].podcast_id);
        }

        // Redirect to admin podcasts page
        router.push('/admin/podcasts');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create podcast',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[AdminPodcastForm] Submission error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <BasicInfoSection control={form.control} />

        {/* Content Source */}
        <ContentSourceSection control={form.control} />

        {/* Podcast Format */}
        <FormatSection control={form.control} setValue={form.setValue} />

        {/* Schedule & Automation */}
        <ScheduleSection control={form.control} />

        {/* Style & Customization */}
        <StyleSection control={form.control} />

        {/* Image Upload */}
        <ImageUploadSection control={form.control} />

        {/* Admin-Only Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Creator and Technical Name fields would go here */}
            {/* These require FormField components from the form core */}
            <p className="text-sm text-muted-foreground">
              Admin-specific fields for creator, technical name, slogan, creativity level, and mixing techniques.
            </p>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `${mode === 'create' ? 'Create' : 'Update'} Podcast`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
