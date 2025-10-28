'use client';

import { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormTextField, FormTextareaField } from '@/components/ui/form-fields';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BaseGroupSectionProps {
  control: Control<any>;
  disabled?: boolean;
  autoFilled?: boolean;
  languageCount: number;
}

/**
 * Base Group Section Component
 *
 * Displays base group-level fields that apply across all language variants.
 * Behavior changes based on whether single-language or multi-language mode:
 *
 * Single-language mode (1 variant):
 * - Fields are auto-filled from the first language variant
 * - Fields are read-only (indicated by muted background)
 * - Shows helper text explaining auto-sync behavior
 *
 * Multi-language mode (2+ variants):
 * - Fields are editable by user
 * - Used as fallback/default metadata for the entire podcast group
 * - Shows description of group-level purpose
 *
 * Fields:
 * - base_title: Group title (used in admin UI, RSS feeds)
 * - base_description: Group description (optional)
 * - base_cover_image: Group cover image URL (optional)
 *
 * @param control - React Hook Form control
 * @param disabled - Whether all fields should be disabled
 * @param autoFilled - Whether fields are auto-synced from first variant (single-language mode)
 * @param languageCount - Number of language variants in the group
 */
export function BaseGroupSection({
  control,
  disabled = false,
  autoFilled = false,
  languageCount,
}: BaseGroupSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {autoFilled ? 'Podcast Information' : 'Base Group Information'}
        </CardTitle>
        <CardDescription>
          {autoFilled
            ? 'These fields will automatically sync with your podcast details below.'
            : 'This information applies to the entire podcast group across all language variants.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {autoFilled ? (
              <>
                You are creating a single-language podcast. These fields will auto-fill from your podcast details.
                Add more languages to create a multilingual podcast group.
              </>
            ) : (
              <>
                You are creating a podcast group with {languageCount} language variants.
                These base fields serve as fallback metadata for the entire group.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Base Title */}
        <FormTextField
          control={control}
          name="base_title"
          label={autoFilled ? 'Title' : 'Base Title'}
          placeholder={autoFilled ? 'Auto-filled from podcast title' : 'Enter the base podcast group title'}
          description={
            autoFilled
              ? 'Auto-filled from your podcast details'
              : 'Used as the default title for the podcast group'
          }
          disabled={disabled || autoFilled}
          required
          className={autoFilled ? 'bg-muted' : ''}
        />

        {/* Base Description */}
        <FormTextareaField
          control={control}
          name="base_description"
          label={autoFilled ? 'Description' : 'Base Description'}
          placeholder={
            autoFilled
              ? 'Auto-filled from podcast description'
              : 'Enter a description for the podcast group (optional)'
          }
          description={
            autoFilled
              ? 'Auto-filled from your podcast details'
              : 'Used as the default description for the podcast group'
          }
          disabled={disabled || autoFilled}
          className={`min-h-20 ${autoFilled ? 'bg-muted' : ''}`}
        />

        {/* Base Cover Image */}
        <FormTextField
          control={control}
          name="base_cover_image"
          label={autoFilled ? 'Cover Image URL' : 'Base Cover Image URL'}
          placeholder={
            autoFilled
              ? 'Auto-filled from podcast cover image'
              : 'https://example.com/cover-image.jpg (optional)'
          }
          description={
            autoFilled
              ? 'Auto-filled from your podcast details'
              : 'Used as the default cover image for the podcast group'
          }
          disabled={disabled || autoFilled}
          className={autoFilled ? 'bg-muted' : ''}
        />
      </CardContent>
    </Card>
  );
}
