'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PodcastsPageTabsProps {
  currentView: 'all' | 'groups';
}

/**
 * Client component for podcast list view tabs
 * Uses URL-based state for view mode selection
 */
export function PodcastsPageTabs({ currentView }: PodcastsPageTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-border">
      <nav className="flex gap-4" aria-label="Podcast views">
        <Link
          href={`${pathname}`}
          className={`
            px-4 py-2 border-b-2 font-medium text-sm transition-colors
            ${
              currentView === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }
          `}
        >
          All Podcasts
        </Link>
        <Link
          href={`${pathname}?view=groups`}
          className={`
            px-4 py-2 border-b-2 font-medium text-sm transition-colors
            ${
              currentView === 'groups'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }
          `}
        >
          Podcast Groups
        </Link>
      </nav>
    </div>
  );
}
