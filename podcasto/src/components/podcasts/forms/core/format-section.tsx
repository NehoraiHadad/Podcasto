'use client';

import { Control, Controller, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { FormatSelector } from '@/components/admin/podcast-form/format-selector';
import { FormSelectField } from '@/components/ui/form-fields';

interface FormatSectionProps {
  control: Control<any>;
  disabled?: boolean;
  setValue?: (name: string, value: any) => void;
}

const SPEAKER_ROLE_OPTIONS = [
  { value: 'host', label: 'Host - Leads and facilitates the conversation' },
  { value: 'interviewer', label: 'Interviewer - Asks probing questions' },
  { value: 'moderator', label: 'Moderator - Guides and manages the discussion' },
  { value: 'guide', label: 'Guide - Explains and educates' },
  { value: 'expert', label: 'Expert - Provides specialized knowledge' },
  { value: 'domain-expert', label: 'Domain Expert - Deep expertise in specific field' },
  { value: 'guest', label: 'Guest - Shares experiences and insights' },
  { value: 'analyst', label: 'Analyst - Analyzes and interprets information' },
];

/**
 * Podcast format selection section with speaker role configuration.
 * Integrates with the existing FormatSelector component.
 *
 * Fields:
 * - podcastFormat: 'single-speaker' | 'multi-speaker'
 * - speaker1Role: Always required
 * - speaker2Role: Required only for multi-speaker format
 *
 * Automatically clears speaker2Role when switching to single-speaker format.
 */
export function FormatSection({ control, disabled = false, setValue }: FormatSectionProps) {
  const podcastFormat = useWatch({ control, name: 'podcastFormat' });

  useEffect(() => {
    if (podcastFormat === 'single-speaker' && setValue) {
      setValue('speaker2Role', '');
    }
  }, [podcastFormat, setValue]);

  return (
    <div className="space-y-4">
      <Controller
        name="podcastFormat"
        control={control}
        render={({ field }) => (
          <FormatSelector
            value={field.value || 'multi-speaker'}
            onChange={field.onChange}
          />
        )}
      />

      <FormSelectField
        control={control}
        name="speaker1Role"
        label={podcastFormat === 'single-speaker' ? 'Speaker Role' : 'Speaker 1 Role'}
        placeholder={podcastFormat === 'single-speaker' ? "Select speaker's role" : "Select Speaker 1's role"}
        description={
          podcastFormat === 'single-speaker'
            ? 'The role of the speaker in the podcast'
            : 'The role of the first speaker in the conversation'
        }
        options={SPEAKER_ROLE_OPTIONS}
        required
        disabled={disabled}
      />

      {podcastFormat === 'multi-speaker' && (
        <FormSelectField
          control={control}
          name="speaker2Role"
          label="Speaker 2 Role"
          placeholder="Select Speaker 2's role"
          description="The role of the second speaker in the conversation"
          options={SPEAKER_ROLE_OPTIONS}
          required
          disabled={disabled}
        />
      )}
    </div>
  );
}
