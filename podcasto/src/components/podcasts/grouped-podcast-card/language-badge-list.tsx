'use client';

import Link from 'next/link';
import { LanguageBadge } from '../language-badge';
import { cn } from '@/lib/utils';

export interface LanguageVariant {
  code: string;
  title: string;
}

interface LanguageBadgeListProps {
  languages: LanguageVariant[];
  currentLanguageCode: string;
  podcastSlug: string;
  onLanguageHover: (code: string | null) => void;
  hoveredLanguage: string | null;
}

/**
 * Language Badge List - Client component
 *
 * Displays clickable language badges for switching between variants.
 * Handles hover states and active highlighting.
 */
export function LanguageBadgeList({
  languages,
  currentLanguageCode,
  podcastSlug,
  onLanguageHover,
  hoveredLanguage
}: LanguageBadgeListProps) {
  if (languages.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Available languages"
    >
      {languages.map((lang) => {
        const isActive = lang.code === currentLanguageCode;
        const isHovered = hoveredLanguage === lang.code;

        return (
          <Link
            key={lang.code}
            href={`/podcasts/${podcastSlug}?lang=${lang.code}`}
            className={cn(
              'inline-block transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
              'rounded-md'
            )}
            onMouseEnter={() => onLanguageHover(lang.code)}
            onMouseLeave={() => onLanguageHover(null)}
            aria-label={`View ${lang.title}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <LanguageBadge
              languageCode={lang.code}
              useNativeName
              className={cn(
                'transition-all duration-200 cursor-pointer',
                isActive && 'bg-primary text-primary-foreground shadow-sm',
                !isActive && isHovered && 'bg-secondary/80 scale-105',
                !isActive && !isHovered && 'hover:bg-secondary/60'
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
