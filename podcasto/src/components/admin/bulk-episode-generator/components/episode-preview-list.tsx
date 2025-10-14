'use client';

import { formatDateRange } from '@/lib/utils/episode-date-calculator';
import type { EpisodeDateInfo } from '../types';

interface EpisodePreviewListProps {
  episodes: EpisodeDateInfo[];
}

export function EpisodePreviewList({ episodes }: EpisodePreviewListProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Episodes to be created:</p>
      <div className="max-h-[200px] overflow-y-auto space-y-1 text-sm">
        {episodes.map((episode) => (
          <div
            key={episode.episodeNumber}
            className="flex items-center gap-2 p-2 bg-muted rounded-md"
          >
            <span className="font-mono text-xs text-muted-foreground">
              #{episode.episodeNumber}
            </span>
            <span>{formatDateRange(episode)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
