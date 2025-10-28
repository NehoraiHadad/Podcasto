'use client';

import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface AdminSettingsSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

/**
 * Admin-only advanced settings section.
 *
 * Includes:
 * - Creator name
 * - Technical podcast name (auto-slug supported)
 * - Slogan
 * - Creativity level slider (0-1)
 * - Mixing techniques checkboxes
 * - Additional instructions textarea
 */
export function AdminSettingsSection({ control, disabled = false }: AdminSettingsSectionProps) {
  const mixingTechniquesOptions = [
    { id: 'rhetorical-questions', label: 'Rhetorical Questions' },
    { id: 'personal-anecdotes', label: 'Personal Anecdotes' },
    { id: 'analogies', label: 'Analogies & Metaphors' },
    { id: 'humor', label: 'Humor & Wit' },
    { id: 'storytelling', label: 'Storytelling' },
    { id: 'data-visualization', label: 'Data Visualization' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Creator Name */}
        <FormField
          control={control}
          name="creator"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creator Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Name of the podcast creator
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Technical Podcast Name */}
        <FormField
          control={control}
          name="podcastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technical Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="tech-news-daily"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                URL-friendly identifier (lowercase, hyphens only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Slogan */}
      <FormField
        control={control}
        name="slogan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slogan (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Your daily tech news briefing"
                {...field}
                value={field.value || ''}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              A short, catchy tagline for your podcast
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Creativity Level */}
      <FormField
        control={control}
        name="creativityLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Creativity Level: {field.value?.toFixed(1) || '0.7'}</FormLabel>
            <FormControl>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[field.value || 0.7]}
                onValueChange={(vals) => field.onChange(vals[0])}
                disabled={disabled}
                className="w-full"
              />
            </FormControl>
            <FormDescription>
              Controls how creative and varied the AI generation is (0 = conservative, 1 = very creative)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mixing Techniques */}
      <FormField
        control={control}
        name="mixingTechniques"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mixing Techniques</FormLabel>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {mixingTechniquesOptions.map((technique) => (
                <div key={technique.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={technique.id}
                    checked={field.value?.includes(technique.id)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      if (checked) {
                        field.onChange([...current, technique.id]);
                      } else {
                        field.onChange(current.filter((t: string) => t !== technique.id));
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={technique.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {technique.label}
                  </Label>
                </div>
              ))}
            </div>
            <FormDescription>
              Select conversation enhancement techniques to use
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Additional Instructions */}
      <FormField
        control={control}
        name="additionalInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Instructions (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special instructions for episode generation..."
                className="min-h-[100px] resize-y"
                {...field}
                value={field.value || ''}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              Custom instructions or preferences for the AI generator
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
