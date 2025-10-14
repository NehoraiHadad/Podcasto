'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormTextField, FormSelectField } from '@/components/ui/form-fields';

type FormValues = {
  podcastName?: string;
  outputLanguage?: string;
  episodeFrequency?: number;
  slogan?: string;
  creativityLevel?: number;
  [key: string]: unknown;
};

interface BasicSettingsFieldsProps<T extends FormValues> {
  form: UseFormReturn<T>;
}

export function BasicSettingsFields<T extends FormValues>({ form }: BasicSettingsFieldsProps<T>) {
  return (
    <>
      <FormTextField
        control={form.control}
        name={"podcastName" as const as Path<T>}
        label="Podcast Name"
        placeholder="Enter podcast name"
        required={true}
      />

      <FormSelectField
        control={form.control}
        name={"outputLanguage" as const as Path<T>}
        label="Output Language"
        placeholder="Select language"
        required={true}
        options={[
          { value: 'english', label: 'English' },
          { value: 'hebrew', label: 'Hebrew' },
        ]}
      />
      
      <FormField
        control={form.control}
        name={"episodeFrequency" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Episode Frequency: {String(field.value || 7)} days
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={1}
                  max={30}
                  step={1}
                  defaultValue={[7]}
                  value={[Number(field.value) || 7]}
                  onValueChange={(values) => field.onChange(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Daily</span>
                  <span>Weekly</span>
                  <span>Monthly</span>
                </div>
              </div>
            </FormControl>
            <FormDescription>
              How often a new episode should be created (1-30 days)
            </FormDescription>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />


      <FormTextField
        control={form.control}
        name={"slogan" as const as Path<T>}
        label="Slogan"
        placeholder="Enter podcast slogan"
        description="Optional - Add a short slogan for your podcast"
      />
      
      <FormField
        control={form.control}
        name={"creativityLevel" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Creativity Level
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[Number(field.value) || 0.5]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className={form.formState.errors.creativityLevel ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Factual</span>
                  <span>Creative</span>
                </div>
              </div>
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
    </>
  );
} 