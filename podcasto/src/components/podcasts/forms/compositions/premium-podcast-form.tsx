'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

import {
  BasicInfoSection,
  ContentSourceSection,
  FormatSection,
  ScheduleSection,
  ImageUploadSection,
} from '../core';

import {
  premiumPodcastSchemaValidated,
  defaultPodcastValues,
} from '../shared/schemas';

import type {
  PremiumPodcastFormProps,
  PremiumPodcastFormValues,
} from '../shared/types';

import { createPremiumPodcastAction } from '@/lib/actions/podcast-group-actions';

/**
 * Premium Podcast Form
 *
 * Simplified form for premium users with format selection capability.
 * Premium users can choose between single-speaker and multi-speaker formats.
 *
 * Features:
 * - Basic info, content source, format selection, schedule, and image upload
 * - No style customization (uses sensible defaults)
 * - No admin-only fields
 */
export function PremiumPodcastForm({
  onSuccess,
  onCancel,
}: PremiumPodcastFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<PremiumPodcastFormValues>({
    resolver: zodResolver(premiumPodcastSchemaValidated),
    defaultValues: defaultPodcastValues,
  });

  const onSubmit = async (values: PremiumPodcastFormValues) => {
    setIsSubmitting(true);

    try {
      // Transform form values for premium action
      const payload = {
        base_title: values.title,
        base_description: values.description || '',
        base_cover_image: values.cover_image || '',
        language: {
          title: values.title,
          description: values.description || '',
          cover_image: values.cover_image || undefined,
          image_style: values.image_style || undefined,
          contentSource: (values.contentSource === 'rss' ? 'urls' : values.contentSource) as 'telegram' | 'urls',
          telegramChannel: values.contentSource === 'telegram' ? values.telegramChannelName : undefined,
          telegramHours: values.contentSource === 'telegram' ? values.telegramHours : undefined,
          urls: values.contentSource === 'rss' && values.rssUrl ? [values.rssUrl] : undefined,
          podcastFormat: values.podcastFormat,
          speaker1Role: values.speaker1Role,
          speaker2Role: values.speaker2Role || undefined,
          conversationStyle: values.conversationStyle || 'casual',
          introPrompt: values.introPrompt,
          outroPrompt: values.outroPrompt,
          episodeFrequency: values.episodeFrequency,
          autoGeneration: values.autoGeneration || false,
          language: values.language === 'english' ? 'en' : 'he',
          outputLanguage: values.language,
        },
      };

      // Call premium-specific server action
      const result = await createPremiumPodcastAction(payload);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Podcast created successfully',
        });

        if (onSuccess && result.data?.languages?.[0]?.podcast_id) {
          onSuccess(result.data.languages[0].podcast_id);
        }

        // Redirect to user's podcasts page
        router.push('/podcasts/my');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create podcast',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[PremiumPodcastForm] Submission error:', error);
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

        {/* Podcast Format (premium feature) */}
        <FormatSection control={form.control} setValue={form.setValue} />

        {/* Schedule & Automation */}
        <ScheduleSection control={form.control} />

        {/* Image Upload */}
        <ImageUploadSection control={form.control} />

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
              'Create Podcast'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
