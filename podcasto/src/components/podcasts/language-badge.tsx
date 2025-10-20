import { Badge } from '@/components/ui/badge';
import { formatLanguageDisplay, getLanguageDirection } from '@/lib/utils/language-utils';
import { cn } from '@/lib/utils';

export interface LanguageBadgeProps {
  languageCode: string;
  useNativeName?: boolean;
  className?: string;
}

/**
 * Language Badge - User-facing component
 *
 * Displays a small badge showing the podcast language with flag emoji.
 * Automatically handles RTL text direction for Hebrew, Arabic, etc.
 *
 * @example
 * <LanguageBadge languageCode="he" useNativeName />
 * // Renders: 🇮🇱 עברית
 */
export function LanguageBadge({
  languageCode,
  useNativeName = false,
  className
}: LanguageBadgeProps) {
  const displayText = formatLanguageDisplay(languageCode, useNativeName);
  const direction = getLanguageDirection(languageCode);

  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs font-normal select-none',
        className
      )}
      dir={direction}
      aria-label={`Language: ${displayText}`}
    >
      {displayText}
    </Badge>
  );
}
