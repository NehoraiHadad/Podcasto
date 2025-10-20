'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatLanguageDisplay, getLanguageDirection } from '@/lib/utils/language-utils';
import { cn } from '@/lib/utils';

export interface PodcastLanguage {
  code: string;
  title: string;
  is_primary?: boolean;
}

export interface SubscriptionLanguageSelectorProps {
  languages: PodcastLanguage[];
  defaultLanguage?: string;
  onSelect: (code: string) => void;
  value?: string;
  className?: string;
}

/**
 * Subscription Language Selector - Client component
 *
 * Radio group for choosing preferred language when subscribing to a podcast.
 * Displays flag + native name for each language with proper RTL support.
 *
 * @example
 * <SubscriptionLanguageSelector
 *   languages={[
 *     { code: 'he', title: 'Hebrew Edition', is_primary: true },
 *     { code: 'en', title: 'English Edition' }
 *   ]}
 *   defaultLanguage="he"
 *   onSelect={(code) => setSelectedLanguage(code)}
 * />
 */
export function SubscriptionLanguageSelector({
  languages,
  defaultLanguage,
  onSelect,
  value,
  className
}: SubscriptionLanguageSelectorProps) {
  const defaultValue = value || defaultLanguage || languages.find(l => l.is_primary)?.code || languages[0]?.code;

  if (languages.length === 0) {
    return null;
  }

  // If only one language, auto-select it
  if (languages.length === 1) {
    const lang = languages[0];
    if (lang) {
      return (
        <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
          <span>{formatLanguageDisplay(lang.code, true)}</span>
          <span className="text-xs">({lang.title})</span>
        </div>
      );
    }
  }

  return (
    <RadioGroup
      value={defaultValue}
      onValueChange={onSelect}
      className={cn('gap-3', className)}
      aria-label="Select podcast language"
    >
      {languages.map((lang) => {
        const direction = getLanguageDirection(lang.code);
        const displayText = formatLanguageDisplay(lang.code, true);

        return (
          <div
            key={lang.code}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border border-border/60',
              'hover:bg-accent/50 transition-colors cursor-pointer',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2'
            )}
          >
            <RadioGroupItem
              value={lang.code}
              id={`lang-${lang.code}`}
              aria-label={`Select ${lang.title}`}
            />
            <Label
              htmlFor={`lang-${lang.code}`}
              className="flex-1 cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <span
                  className="font-medium text-sm"
                  dir={direction}
                >
                  {displayText}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lang.title}
                  {lang.is_primary && (
                    <span className="ml-2 text-primary">(Primary)</span>
                  )}
                </span>
              </div>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
