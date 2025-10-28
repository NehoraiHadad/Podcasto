'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FormTextField, FormSelectField } from '@/components/ui/form-fields';
import { TooltipLabel } from '@/components/ui/tooltip-label';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { generateSlug } from './utils/slug-generator';
import { SUPPORTED_OUTPUT_LANGUAGES, LANGUAGE_NAMES, type OutputLanguage } from '@/lib/constants/languages';

type FormValues = {
  title?: string;
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
  const [manualEdit, setManualEdit] = useState(false);
  const title = form.watch('title' as Path<T>) as string | undefined;
  const podcastName = form.watch('podcastName' as Path<T>) as string | undefined;

  // Auto-generate slug from title when title changes (unless manually edited)
  useEffect(() => {
    if (title && !manualEdit) {
      const slug = generateSlug(title);
      if (slug !== podcastName) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setValue('podcastName' as Path<T>, slug as any, { shouldValidate: true });
      }
    }
  }, [title, manualEdit, podcastName, form]);

  const handleManualChange = () => {
    setManualEdit(true);
  };

  const handleRegenerateSlug = () => {
    if (title) {
      const slug = generateSlug(title);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue('podcastName' as Path<T>, slug as any, { shouldValidate: true });
      setManualEdit(false);
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name={"podcastName" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <TooltipLabel
              label="Technical Name"
              tooltip="Internal identifier used for processing and API calls. This is automatically generated from your podcast title but can be customized. Use lowercase letters, numbers, and hyphens only."
              required
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <FormControl>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    placeholder="my-awesome-podcast"
                    value={String(field.value || '')}
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleManualChange();
                    }}
                  />
                </FormControl>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRegenerateSlug}
                disabled={!title}
                title="Regenerate from title"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {manualEdit
                ? 'Manually edited. Click the refresh button to regenerate from title.'
                : 'Auto-generated from podcast title. You can edit it manually if needed.'}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <TooltipLabel
          label="Output Language"
          tooltip="The language in which the podcast will be generated. This affects both the text-to-speech and the conversation style."
          required
        />
        <FormSelectField
          control={form.control}
          name={"outputLanguage" as const as Path<T>}
          label=""
          placeholder="Select language"
          options={SUPPORTED_OUTPUT_LANGUAGES.map((lang) => ({
            value: lang,
            label: LANGUAGE_NAMES[lang as OutputLanguage],
          }))}
        />
      </div>

      <FormField
        control={form.control}
        name={"episodeFrequency" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <TooltipLabel
              label={`Episode Frequency: ${String(field.value || 7)} days`}
              tooltip="How often new episodes will be automatically generated. For example, setting this to 7 means a new episode will be created weekly."
              required
            />
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
                  <span>Daily (1)</span>
                  <span>Weekly (7)</span>
                  <span>Monthly (30)</span>
                </div>
              </div>
            </FormControl>
            <FormDescription>
              Next episode will be created approximately {String(field.value || 7)} days after the previous one
            </FormDescription>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <TooltipLabel
          label="Slogan (Optional)"
          tooltip="A short, catchy phrase that captures the essence of your podcast. This can be displayed alongside your podcast title."
        />
        <FormTextField
          control={form.control}
          name={"slogan" as const as Path<T>}
          label=""
          placeholder="Your daily dose of tech insights"
          description="A memorable tagline for your podcast"
        />
      </div>

      <FormField
        control={form.control}
        name={"creativityLevel" as const as Path<T>}
        render={({ field }) => (
          <FormItem>
            <TooltipLabel
              label={`Creativity Level: ${Number(field.value || 0.7).toFixed(1)}`}
              tooltip="Controls how creative and conversational the AI will be. Lower values (0-0.4) are more factual and stick closely to source material. Higher values (0.6-1.0) allow for more creative interpretation and engaging conversations."
              required
            />
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[Number(field.value) || 0.7]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className={form.formState.errors.creativityLevel ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Factual (0.0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>
            </FormControl>
            <FormDescription>
              {Number(field.value || 0.7) < 0.4
                ? 'Highly factual - sticks closely to source material'
                : Number(field.value || 0.7) < 0.7
                ? 'Balanced - mix of facts and engaging conversation'
                : 'Creative - more interpretation and storytelling'}
            </FormDescription>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
    </>
  );
} 