'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageBadgeList } from './language-badge-list';

export interface PodcastGroupLanguage {
  code: string;
  title: string;
  description?: string;
  podcast_id: string;
  episode_count?: number;
  cover_image?: string;
  is_primary?: boolean;
}

export interface PodcastGroupWithLanguages {
  id: string;
  name: string;
  slug: string;
  languages: PodcastGroupLanguage[];
}

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
 * Extends the existing podcast-card pattern with multilingual support.
 *
 * @example
 * <GroupedPodcastCard
 *   podcastGroup={{
 *     id: '123',
 *     name: 'Abuali Express',
 *     slug: 'abuali-express',
 *     languages: [
 *       { code: 'he', title: 'Hebrew Edition', podcast_id: 'abc', is_primary: true },
 *       { code: 'en', title: 'English Edition', podcast_id: 'def' }
 *     ]
 *   }}
 *   currentLanguage="he"
 * />
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
    ? podcastGroup.languages.find(l => l.code === currentLanguage)
    : null;
  const displayLanguage = currentLang || primaryLanguage;

  if (!displayLanguage) {
    return null;
  }

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/60 transition-all duration-300',
        'hover:shadow-lg hover:border-border',
        className
      )}
    >
      {/* Cover Image */}
      {displayLanguage.cover_image && (
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={displayLanguage.cover_image}
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

          <LanguageBadgeList
            languages={podcastGroup.languages}
            currentLanguageCode={displayLanguage.code}
            podcastSlug={podcastGroup.slug}
            onLanguageHover={setHoveredLanguage}
            hoveredLanguage={hoveredLanguage}
          />

          {/* Episode Count */}
          {displayLanguage.episode_count !== undefined && (
            <div className="text-sm text-muted-foreground">
              {displayLanguage.episode_count} {displayLanguage.episode_count === 1 ? 'episode' : 'episodes'}
            </div>
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
