'use client';

import { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormValues } from './types';

interface AdvancedSettingsTabClientProps {
  form: UseFormReturn<FormValues>;
}

export function AdvancedSettingsTabClient({ form }: AdvancedSettingsTabClientProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="isLongPodcast"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Long Podcast</FormLabel>
              <FormDescription>
                Enable for a longer, more detailed podcast
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="discussionRounds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discussion Rounds: {field.value}</FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[field.value]}
                onValueChange={(values) => field.onChange(values[0])}
              />
            </FormControl>
            <FormDescription>
              Number of discussion rounds (1-20)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="minCharsPerRound"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Characters Per Round: {field.value}</FormLabel>
            <FormControl>
              <Slider
                min={100}
                max={2000}
                step={100}
                value={[field.value]}
                onValueChange={(values) => field.onChange(values[0])}
              />
            </FormControl>
            <FormDescription>
              Minimum characters per discussion round (100-2000)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
} 