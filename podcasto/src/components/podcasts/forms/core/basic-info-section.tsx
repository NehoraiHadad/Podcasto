'use client';

import { Control } from 'react-hook-form';
import { FormTextField, FormTextareaField, FormSelectField } from '@/components/ui/form-fields';
import { SUPPORTED_OUTPUT_LANGUAGES, LANGUAGE_NAMES } from '@/lib/constants/languages';

interface BasicInfoSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

// Map all supported languages to select options
const LANGUAGE_OPTIONS = SUPPORTED_OUTPUT_LANGUAGES.map((lang) => ({
  value: lang,
  label: LANGUAGE_NAMES[lang],
}));

/**
 * Basic podcast information section with title, description, and language selection.
 * Reusable across admin, premium, and user forms.
 *
 * Fields:
 * - title: Required text field for podcast name
 * - description: Required textarea for podcast description
 * - language: Optional select dropdown for language preference
 */
export function BasicInfoSection({ control, disabled = false }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <FormTextField
        control={control}
        name="title"
        label="Podcast Title"
        placeholder="My Awesome Tech Podcast"
        description="The public name that listeners will see"
        required
        disabled={disabled}
      />

      <FormTextareaField
        control={control}
        name="description"
        label="Description"
        placeholder="Join me as I explore the latest trends in technology, interviewing experts and breaking down complex topics into easy-to-understand conversations."
        description="A detailed description of your podcast (50-200 characters recommended)"
        required
        disabled={disabled}
        className="min-h-24 md:min-h-32"
      />

      <FormSelectField
        control={control}
        name="language"
        label="Language"
        placeholder="Select a language"
        description="The primary language of your podcast"
        options={LANGUAGE_OPTIONS}
        disabled={disabled}
      />
    </div>
  );
}
