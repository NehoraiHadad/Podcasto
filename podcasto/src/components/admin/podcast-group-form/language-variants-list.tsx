import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Control, UseFormReturn } from 'react-hook-form';
import type { Podcast } from '@/lib/db/api/podcasts/types';
import type { PodcastGroupFormValues } from './schema';
import { LanguageVariantCard } from './language-variant-card';

/**
 * Props for LanguageVariantsList component
 */
export interface LanguageVariantsListProps {
  control: Control<PodcastGroupFormValues>;
  form: UseFormReturn<PodcastGroupFormValues>;
  availablePodcasts: Podcast[];
}

/**
 * Language Variants List Component
 *
 * Manages the list of language variants in the form.
 */
export function LanguageVariantsList({
  control,
  form,
  availablePodcasts,
}: LanguageVariantsListProps) {
  const languages = form.watch('languages') || [];

  const addLanguageVariant = () => {
    form.setValue('languages', [
      ...languages,
      {
        language_code: '',
        podcast_id: '',
        title: '',
        description: '',
        is_primary: languages.length === 0,
      },
    ]);
  };

  const removeLanguageVariant = (index: number) => {
    form.setValue('languages', languages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Language Variants</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLanguageVariant}
          aria-label="Add language variant"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      </div>

      {languages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No language variants added. Click "Add Language" to get started.
        </p>
      )}

      {languages.map((_, index) => (
        <LanguageVariantCard
          key={index}
          index={index}
          control={control}
          availablePodcasts={availablePodcasts}
          onRemove={() => removeLanguageVariant(index)}
        />
      ))}
    </div>
  );
}
