'use client';

import { createContext, useContext } from 'react';
import { Card } from '@/components/ui/card';
import { PodcastCardContextValue, PodcastCardProps } from './types';
import { PodcastCardImage } from './podcast-card-image';
import { PodcastCardTitle } from './podcast-card-title';
import { PodcastCardEpisodeCount } from './podcast-card-episode-count';
import { PodcastCardDescription } from './podcast-card-description';
import { PodcastCardListenButton } from './podcast-card-listen-button';

/**
 * Context for sharing podcast data between PodcastCard and its sub-components
 */
const PodcastCardContext = createContext<PodcastCardContextValue | null>(null);

/**
 * Hook to access PodcastCard context
 * @throws {Error} If used outside of PodcastCard component
 */
export function usePodcastCard() {
  const context = useContext(PodcastCardContext);
  if (!context) {
    throw new Error('PodcastCard sub-components must be used within PodcastCard');
  }
  return context;
}

/**
 * Root component for PodcastCard compound component
 * Provides default layout when no children are provided, or allows custom composition
 */
export function PodcastCardRoot({ podcast, children }: PodcastCardProps) {
  const contextValue: PodcastCardContextValue = { podcast };

  return (
    <PodcastCardContext.Provider value={contextValue}>
      <Card className="overflow-hidden border-border/60 card-hover">
        {children || (
          <>
            <PodcastCardImage />
            <div className="flex flex-col gap-6 py-6">
              <div className="flex flex-col gap-1.5 px-6">
                <PodcastCardTitle />
                <PodcastCardEpisodeCount />
              </div>
              <div className="px-6">
                <PodcastCardDescription />
              </div>
              <div className="flex items-center px-6">
                <PodcastCardListenButton />
              </div>
            </div>
          </>
        )}
      </Card>
    </PodcastCardContext.Provider>
  );
}
