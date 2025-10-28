'use client';

import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { FormSelectField } from '@/components/ui/form-fields';
import { Switch } from '@/components/ui/switch';

interface ScheduleSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily - New episode every day' },
  { value: 'weekly', label: 'Weekly - New episode every week' },
  { value: 'bi-weekly', label: 'Bi-weekly - New episode every two weeks' },
  { value: 'monthly', label: 'Monthly - New episode every month' },
];

/**
 * Podcast scheduling section for episode frequency and auto-generation settings.
 * Controls how often episodes are automatically created.
 *
 * Fields:
 * - episodeFrequency: Select dropdown for generation frequency
 * - autoGeneration: Toggle switch to enable/disable automatic episode creation
 */
export function ScheduleSection({ control, disabled = false }: ScheduleSectionProps) {
  return (
    <div className="space-y-4">
      <FormSelectField
        control={control}
        name="episodeFrequency"
        label="Episode Frequency"
        placeholder="Select frequency"
        description="How often new episodes will be automatically generated"
        options={FREQUENCY_OPTIONS}
        required
        disabled={disabled}
      />

      <FormField
        control={control}
        name="autoGeneration"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Auto-Generation</FormLabel>
              <FormDescription>
                Automatically create new episodes based on the schedule above.
                When disabled, you will need to manually trigger episode creation.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
