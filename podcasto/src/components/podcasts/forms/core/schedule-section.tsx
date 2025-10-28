'use client';

import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface ScheduleSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

/**
 * Podcast scheduling section for episode frequency and auto-generation settings.
 * Controls how often episodes are automatically created.
 *
 * Fields:
 * - episodeFrequency: Numeric slider/input for days between episodes (1-30)
 * - autoGeneration: Toggle switch to enable/disable automatic episode creation
 */
export function ScheduleSection({ control, disabled = false }: ScheduleSectionProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="episodeFrequency"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Episode Frequency (Days)</FormLabel>
              <Input
                type="number"
                min={1}
                max={30}
                value={field.value || 7}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 7)}
                className="min-w-[60px] w-16 sm:w-20 text-center"
                disabled={disabled}
              />
            </div>
            <FormControl>
              <Slider
                min={1}
                max={30}
                step={1}
                value={[field.value || 7]}
                onValueChange={(vals) => field.onChange(vals[0])}
                disabled={disabled}
                className="w-full"
              />
            </FormControl>
            <FormDescription>
              Generate new episodes every {field.value || 7} day{(field.value || 7) !== 1 ? 's' : ''} (1-30 days range)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
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
