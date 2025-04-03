'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type FormValues = {
  isLongPodcast?: boolean;
  discussionRounds?: number;
  minCharsPerRound?: number;
  [key: string]: unknown;
};

interface AdvancedSettingsFieldsProps<T extends FormValues> {
  form: UseFormReturn<T>;
}

export function AdvancedSettingsFields<T extends FormValues>({ form }: AdvancedSettingsFieldsProps<T>) {
  return (
    <>
      <FormField
        control={form.control}
        name={"isLongPodcast" as const as Path<T>}
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
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name={"discussionRounds" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discussion Rounds: {String(field.value || 1)}</FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[Number(field.value) || 1]}
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
        name={"minCharsPerRound" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Characters Per Round: {String(field.value || 100)}</FormLabel>
            <FormControl>
              <Slider
                min={100}
                max={2000}
                step={100}
                value={[Number(field.value) || 100]}
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