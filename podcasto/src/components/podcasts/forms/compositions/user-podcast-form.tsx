'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormErrorSummary, formatFormErrors } from '@/components/ui/form-error-summary';
import { toast } from 'sonner';

import {
  BasicInfoSection,
  ContentSourceSection,
  ScheduleSection,
  ImageUploadSection,
} from '../core';

import { userPodcastSchema } from '../shared/schemas';

import type {
  UserPodcastFormProps,
  UserPodcastFormValues,
} from '../shared/types';

import { createUserPodcastAction } from '@/lib/actions/podcast-group-actions';

/**
 * User Podcast Form
 *
 * Simplified form for regular (non-premium) users.
 * Format is hardcoded to multi-speaker with sensible defaults.
 *
 * Features:
 * - Basic info, content source, schedule, and image upload only
 * - No format selection (hardcoded to multi-speaker)
 * - No style customization
 * - Minimal configuration for ease of use
 */
export function UserPodcastForm({
  onSuccess,
  onCancel,
}: UserPodcastFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with user defaults (hardcoded multi-speaker)
  const form = useForm<UserPodcastFormValues>({
    resolver: zodResolver(userPodcastSchema),
    defaultValues: {
      title: '',
      description: '',
      language: 'english' as const,
      cover_image: '',
      image_style: null,
      episodeFrequency: 7,
      autoGeneration: false,
      contentSource: 'telegram' as const,
      telegramChannelName: '',
      telegramHours: 24,
      rssUrl: null,
      // Hardcoded format for regular users
      podcastFormat: 'multi-speaker' as const,
      speaker1Role: 'Host',
      speaker2Role: 'Co-host',
      conversationStyle: 'casual' as const,
    },
  });

  const onSubmit = async (values: UserPodcastFormValues) => {
    setIsSubmitting(true);

    try {
      // Transform form values for user action
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
          episodeFrequency: values.episodeFrequency,
          autoGeneration: values.autoGeneration || false,
          language: values.language === 'english' ? 'en' : 'he',
          outputLanguage: values.language,
        },
      };

      // Call user-specific server action
      const result = await createUserPodcastAction(payload);

      if (result.success) {
        toast.success('Podcast Created Successfully!', {
          description: `Your podcast "${values.title}" is ready. You can now start generating episodes.`,
          duration: 5000,
        });

        if (onSuccess && result.data?.languages?.[0]?.podcast_id) {
          onSuccess(result.data.languages[0].podcast_id);
        }

        // Redirect to user's podcasts page
        router.push('/podcasts/my');
      } else {
        toast.error('Failed to Create Podcast', {
          description: result.error || 'Please check your input and try again. If the problem persists, contact support.',
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('[UserPodcastForm] Submission error:', error);
      toast.error('Unexpected Error Occurred', {
        description: 'Something went wrong while creating your podcast. Please try again or contact support if the issue continues.',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Validation Errors */}
        {Object.keys(form.formState.errors).length > 0 && (
          <FormErrorSummary errors={formatFormErrors(form.formState.errors)} />
        )}

        {/* Basic Information */}
        <BasicInfoSection control={form.control} />

        {/* Content Source */}
        <ContentSourceSection control={form.control} />

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
