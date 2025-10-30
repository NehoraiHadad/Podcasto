'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FieldError {
  field: string;
  message: string;
  fieldLabel?: string;
}

interface FormErrorSummaryProps {
  errors: FieldError[];
  className?: string;
}

/**
 * Field name to human-readable label mapping
 * Provides better error messages by showing user-friendly field names
 */
const FIELD_LABELS: Record<string, string> = {
  // Basic info
  title: 'Podcast Title',
  description: 'Description',
  language: 'Language',
  cover_image: 'Cover Image',
  image_style: 'Image Style',

  // Content source
  contentSource: 'Content Source',
  telegramChannelName: 'Telegram Channel',
  telegramHours: 'Telegram Hours',
  rssUrl: 'RSS Feed URL',

  // Format
  podcastFormat: 'Podcast Format',
  speaker1Role: 'Speaker 1 Role',
  speaker2Role: 'Speaker 2 Role',

  // Style
  conversationStyle: 'Conversation Style',
  introPrompt: 'Intro Prompt',
  outroPrompt: 'Outro Prompt',

  // Schedule
  episodeFrequency: 'Episode Frequency',
  autoGeneration: 'Auto Generation',

  // Admin fields
  creator: 'Creator Name',
  podcastName: 'Technical Name',
  slogan: 'Slogan',
  creativityLevel: 'Creativity Level',
  mixingTechniques: 'Mixing Techniques',
  additionalInstructions: 'Additional Instructions',

  // Language variant fields
  language_code: 'Language Code',
  is_primary: 'Primary Language',

  // Base group fields
  base_title: 'Base Title',
  base_description: 'Base Description',
  base_cover_image: 'Base Cover Image',
};

/**
 * Get human-readable label for a field
 */
function getFieldLabel(fieldPath: string): string {
  // Handle nested field paths (e.g., "languages.0.title")
  const parts = fieldPath.split('.');
  const lastPart = parts[parts.length - 1];

  // Check if it's a language variant field
  if (parts.length > 1 && parts[0] === 'languages' && !isNaN(Number(parts[1]))) {
    const variantIndex = Number(parts[1]) + 1;
    const fieldLabel = FIELD_LABELS[lastPart] || lastPart;
    return `Language Variant ${variantIndex}: ${fieldLabel}`;
  }

  return FIELD_LABELS[lastPart] || FIELD_LABELS[fieldPath] || fieldPath;
}

/**
 * FormErrorSummary Component
 *
 * Displays a summary of all form validation errors in a user-friendly way.
 * Shows at the top of the form to give users a clear overview of what needs to be fixed.
 *
 * @example
 * ```tsx
 * <FormErrorSummary errors={[
 *   { field: 'title', message: 'Title is required' },
 *   { field: 'speaker2Role', message: 'Speaker 2 role is required for multi-speaker podcasts' }
 * ]} />
 * ```
 */
export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className={cn('animate-in fade-in-50 slide-in-from-top-2', className)}>
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-semibold">
        {errors.length === 1 ? 'Please fix this error:' : `Please fix ${errors.length} errors:`}
      </AlertTitle>
      <AlertDescription className="mt-3">
        <ul className="space-y-2">
          {errors.map(({ field, message, fieldLabel }, index) => (
            <li key={`${field}-${index}`} className="flex items-start gap-2">
              <span className="text-destructive-foreground/70 mt-0.5">•</span>
              <div className="flex-1">
                <span className="font-medium">
                  {fieldLabel || getFieldLabel(field)}:
                </span>
                {' '}
                <span className="text-destructive-foreground/90">{message}</span>
              </div>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Helper function to convert react-hook-form errors to FieldError array
 */
export function formatFormErrors(errors: Record<string, unknown>): FieldError[] {
  const result: FieldError[] = [];

  function extractErrors(obj: Record<string, unknown>, prefix = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object') {
        // Check if it's an actual error object with a message
        if ('message' in value && value.message) {
          result.push({
            field: fieldPath,
            message: String(value.message),
          });
        } else {
          // Recursively process nested objects (like field arrays)
          extractErrors(value as Record<string, unknown>, fieldPath);
        }
      }
    });
  }

  extractErrors(errors);
  return result;
}
