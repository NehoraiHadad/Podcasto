'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SUPPORTED_LANGUAGES,
  getSupportedLanguageCodes,
  type LanguageCode,
} from '@/lib/utils/language-utils';

/**
 * Props for LanguageSelector component
 */
export interface LanguageSelectorProps {
  /** Currently selected language code */
  value?: string;
  /** Callback when language is changed */
  onChange: (languageCode: string) => void;
  /** Placeholder text when no language is selected */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional ID for form field association */
  id?: string;
  /** Optional aria-label for accessibility */
  'aria-label'?: string;
}

/**
 * Language Selector Component
 *
 * Displays a dropdown of all supported languages with flag emoji and language name.
 * Used throughout admin forms for selecting podcast languages.
 *
 * @example
 * ```tsx
 * <LanguageSelector
 *   value={selectedLanguage}
 *   onChange={(code) => setSelectedLanguage(code)}
 *   placeholder="Select a language"
 * />
 * ```
 */
export function LanguageSelector({
  value,
  onChange,
  placeholder = 'Select language',
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: LanguageSelectorProps) {
  const languageCodes = getSupportedLanguageCodes();

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel || 'Language selector'}
        className="w-full"
      >
        <SelectValue placeholder={placeholder}>
          {value && SUPPORTED_LANGUAGES[value as LanguageCode] && (
            <span className="flex items-center gap-2">
              <span role="img" aria-hidden="true">
                {SUPPORTED_LANGUAGES[value as LanguageCode].flag}
              </span>
              <span>{SUPPORTED_LANGUAGES[value as LanguageCode].name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languageCodes.map((code) => {
          const lang = SUPPORTED_LANGUAGES[code];
          return (
            <SelectItem key={code} value={code}>
              <span className="flex items-center gap-2">
                <span role="img" aria-label={`${lang.name} flag`}>
                  {lang.flag}
                </span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
