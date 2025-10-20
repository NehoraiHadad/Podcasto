import { Badge } from '@/components/ui/badge';
import {
  getLanguageFlag,
  getLanguageInfo,
} from '@/lib/utils/language-utils';
import { cn } from '@/lib/utils';

/**
 * Props for LanguageBadge component
 */
export interface LanguageBadgeProps {
  /** Language code (e.g., 'he', 'en') */
  languageCode: string;
  /** Whether this is the primary language variant */
  isPrimary?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Language Badge Component
 *
 * Displays a small badge with flag emoji and language code.
 * Optionally shows "Primary" indicator for the primary language variant.
 *
 * @example
 * ```tsx
 * <LanguageBadge languageCode="he" isPrimary size="md" />
 * // Renders: 🇮🇱 HE • Primary
 * ```
 */
export function LanguageBadge({
  languageCode,
  isPrimary = false,
  size = 'md',
  className,
}: LanguageBadgeProps) {
  const flag = getLanguageFlag(languageCode);
  const languageInfo = getLanguageInfo(languageCode);
  const displayCode = languageInfo?.code.toUpperCase() || languageCode.toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <Badge
      variant={isPrimary ? 'default' : 'outline'}
      className={cn('gap-1.5', sizeClasses[size], className)}
      aria-label={`${languageInfo?.name || languageCode}${isPrimary ? ' (Primary)' : ''}`}
    >
      <span role="img" aria-hidden="true">
        {flag}
      </span>
      <span className="font-semibold">{displayCode}</span>
      {isPrimary && (
        <>
          <span aria-hidden="true" className="text-muted-foreground">
            •
          </span>
          <span className="text-xs">Primary</span>
        </>
      )}
    </Badge>
  );
}
