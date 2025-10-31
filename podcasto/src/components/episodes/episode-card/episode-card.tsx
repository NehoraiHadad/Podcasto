'use client';

import { createContext, useContext } from 'react';
import { Card } from '@/components/ui/card';
import { EpisodeCardContextValue, EpisodeCardProps } from './types';
import { EpisodeCardImage } from './episode-card-image';
import { EpisodeCardTitle } from './episode-card-title';
import { EpisodeCardDownloadButton } from './episode-card-download-button';
import { EpisodeCardShareButton } from './episode-card-share-button';
import { EpisodeCardBadges } from './episode-card-badges';
import { EpisodeCardDescription } from './episode-card-description';
import { EpisodeCardDuration } from './episode-card-duration';
import { EpisodeCardAudioPlayer } from './episode-card-audio-player';
import { EpisodeCardViewButton } from './episode-card-view-button';

/**
 * Context for sharing episode data between EpisodeCard and its sub-components
 */
const EpisodeCardContext = createContext<EpisodeCardContextValue | null>(null);

/**
 * Hook to access EpisodeCard context
 * @throws {Error} If used outside of EpisodeCard component
 */
export function useEpisodeCard() {
  const context = useContext(EpisodeCardContext);
  if (!context) {
    throw new Error('EpisodeCard sub-components must be used within EpisodeCard');
  }
  return context;
}

/**
 * Root component for EpisodeCard compound component
 * Provides default layout when no children are provided, or allows custom composition
 */
export function EpisodeCardRoot({ episode, podcastId, children }: EpisodeCardProps) {
  const contextValue: EpisodeCardContextValue = { episode, podcastId };

  return (
    <EpisodeCardContext.Provider value={contextValue}>
      <Card className="overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        {children || (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <EpisodeCardImage />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <EpisodeCardTitle />
                  <div className="flex items-center gap-0">
                    <EpisodeCardDownloadButton />
                    <EpisodeCardShareButton />
                  </div>
                </div>
                <EpisodeCardBadges />
                <EpisodeCardDescription />
                <EpisodeCardDuration />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-3">
                  <EpisodeCardAudioPlayer />
                  <EpisodeCardViewButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </EpisodeCardContext.Provider>
  );
}
