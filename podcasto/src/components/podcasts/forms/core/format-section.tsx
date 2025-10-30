'use client';

import { Control, Controller, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { FormatSelector } from '@/components/admin/podcast-form/format-selector';
import { FormSelectField, FormNumberField } from '@/components/ui/form-fields';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormControl, FormItem, FormLabel, FormDescription } from '@/components/ui/form';


interface FormatSectionProps {
  control: Control<any>;
  disabled?: boolean;
  setValue?: (name: string, value: any, options?: { shouldValidate?: boolean; shouldDirty?: boolean }) => void;
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

export function FormatSection({ control, disabled = false, setValue }: FormatSectionProps) {
  const speakerSelectionStrategy = useWatch({ control, name: 'speakerSelectionStrategy', defaultValue: 'fixed' });
  const podcastFormat = useWatch({ control, name: 'podcastFormat', defaultValue: 'multi-speaker' });

  useEffect(() => {
    if (podcastFormat === 'single-speaker' && setValue) {
      setValue('speaker2Role', '');
    }
  }, [podcastFormat, setValue]);

  const isMultiSpeaker = podcastFormat === 'multi-speaker';

  return (
    <div className="space-y-6">
      <Controller
        name="speakerSelectionStrategy"
        control={control}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Speaker Selection Strategy</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="fixed" />
                  </FormControl>
                  <FormLabel className="font-normal">Fixed</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="random" />
                  </FormControl>
                  <FormLabel className="font-normal">Random</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="sequence" />
                  </FormControl>
                  <FormLabel className="font-normal">Sequence</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormDescription>
              Choose how the number of speakers is determined for each episode.
            </FormDescription>
          </FormItem>
        )}
      />

      {speakerSelectionStrategy === 'fixed' && (
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
            label={isMultiSpeaker ? 'Speaker 1 Role' : 'Speaker Role'}
            placeholder={isMultiSpeaker ? "Select Speaker 1's role" : "Select speaker's role"}
            description={isMultiSpeaker ? 'The role of the first speaker' : 'The role of the speaker'}
            options={SPEAKER_ROLE_OPTIONS}
            required
            disabled={disabled}
          />

          {isMultiSpeaker && (
            <FormSelectField
              control={control}
              name="speaker2Role"
              label="Speaker 2 Role"
              placeholder="Select Speaker 2's role"
              description="The role of the second speaker"
              options={SPEAKER_ROLE_OPTIONS}
              required
              disabled={disabled}
            />
          )}
        </div>
      )}

      {speakerSelectionStrategy === 'sequence' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormNumberField
            control={control}
            name="sequenceDualCount"
            label="Multi-Speaker Episodes in Sequence"
            placeholder="e.g., 2"
            description="Number of multi-speaker episodes to generate in a row."
            required
            disabled={disabled}
          />
          <FormNumberField
            control={control}
            name="sequenceSingleCount"
            label="Single-Speaker Episodes in Sequence"
            placeholder="e.g., 1"
            description="Number of single-speaker episodes to generate in a row."
            required
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
