'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatLanguageDisplay, getLanguageDirection } from '@/lib/utils/language-utils';
import { cn } from '@/lib/utils';

export interface LanguageOption {
  code: string;
  title: string;
}

export interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: LanguageOption[];
  onLanguageChange: (code: string) => void;
  className?: string;
}

/**
 * Language Switcher - Client component
 *
 * Displays available language variants as tabs with smooth transitions.
 * Handles RTL text direction automatically for each language.
 *
 * @example
 * <LanguageSwitcher
 *   currentLanguage="he"
 *   availableLanguages={[
 *     { code: 'he', title: 'Hebrew Variant' },
 *     { code: 'en', title: 'English Variant' }
 *   ]}
 *   onLanguageChange={(code) => router.push(`/podcasts/${code}/123`)}
 * />
 */
export function LanguageSwitcher({
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  className
}: LanguageSwitcherProps) {
  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <Tabs
      value={currentLanguage}
      onValueChange={onLanguageChange}
      className={cn('w-fit', className)}
    >
      <TabsList
        className="bg-muted/50"
        aria-label="Select podcast language"
      >
        {availableLanguages.map((lang) => {
          const direction = getLanguageDirection(lang.code);
          const displayText = formatLanguageDisplay(lang.code, true);

          return (
            <TabsTrigger
              key={lang.code}
              value={lang.code}
              dir={direction}
              className={cn(
                'min-w-[80px] transition-all duration-200',
                'hover:bg-background/80',
                'focus-visible:ring-2 focus-visible:ring-offset-2'
              )}
              aria-label={`Switch to ${lang.title}`}
            >
              <span className="text-sm">{displayText}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
