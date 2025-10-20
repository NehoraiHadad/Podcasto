'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageBadgeList } from './language-badge-list';
import type { PodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups';

export interface GroupedPodcastCardProps {
  podcastGroup: PodcastGroupWithLanguages;
  currentLanguage?: string;
  className?: string;
}

/**
 * Grouped Podcast Card - Client component
 *
 * Displays a podcast card with multiple language variants.
 * Shows language badges that navigate to the selected variant.
 */
export function GroupedPodcastCard({
  podcastGroup,
  currentLanguage,
  className
}: GroupedPodcastCardProps) {
  const [hoveredLanguage, setHoveredLanguage] = useState<string | null>(null);

  // Determine which language variant to display
  const primaryLanguage = podcastGroup.languages.find(l => l.is_primary) || podcastGroup.languages[0];
  const currentLang = currentLanguage
    ? podcastGroup.languages.find(l => l.language_code === currentLanguage)
    : null;
  const displayLanguage = currentLang || primaryLanguage;

  if (!displayLanguage) {
    return null;
  }

  // Use base cover image or language-specific one
  const coverImage = displayLanguage.cover_image || podcastGroup.base_cover_image;

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/60 transition-all duration-300',
        'hover:shadow-lg hover:border-border',
        className
      )}
    >
      {/* Cover Image */}
      {coverImage && (
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={coverImage}
            alt={displayLanguage.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex flex-col gap-6 py-6">
        {/* Title and Language Badges */}
        <div className="flex flex-col gap-3 px-6">
          <h3 className="leading-tight font-semibold text-lg text-foreground">
            {displayLanguage.title}
          </h3>

          {/* Show language badges only if multiple languages */}
          {podcastGroup.languages.length > 1 && (
            <LanguageBadgeList
              languages={podcastGroup.languages.map(lang => ({
                code: lang.language_code,
                title: lang.title,
                podcast_id: lang.podcast_id,
                is_primary: lang.is_primary
              }))}
              currentLanguageCode={displayLanguage.language_code}
              podcastSlug={podcastGroup.id}
              onLanguageHover={setHoveredLanguage}
              hoveredLanguage={hoveredLanguage}
            />
          )}
        </div>

        {/* Description */}
        {displayLanguage.description && (
          <div className="px-6">
            <p className="text-foreground/80 text-sm line-clamp-3">
              {displayLanguage.description}
            </p>
          </div>
        )}

        {/* Listen Button */}
        <div className="flex items-center px-6">
          <Link
            href={`/podcasts/${displayLanguage.podcast_id}`}
            className={cn(
              'inline-flex items-center justify-center rounded-md',
              'bg-primary text-primary-foreground shadow-sm',
              'h-10 px-4 py-2 text-sm font-medium',
              'transition-colors hover:bg-primary/90',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            Listen Now
          </Link>
        </div>
      </div>
    </Card>
  );
}
