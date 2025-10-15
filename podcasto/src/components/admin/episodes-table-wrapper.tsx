'use client';

import { useState } from 'react';
import { EpisodesTable } from '@/components/admin/episodes';
import { EpisodesBulkActionsBar } from './episodes-bulk-actions-bar';

// Define the expected episode type for the component
interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string | null;
  language: string | null;
  audio_url: string | null;
  duration: number | null;
  created_at: string | null;
  published_at: string | null;
  status: string | null;
  metadata: string | null;
  cover_image: string | null;
  content_start_date: string | null;
  content_end_date: string | null;
  podcast_title?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface EpisodesTableWrapperProps {
  episodes: Episode[];
}

export function EpisodesTableWrapper({ episodes }: EpisodesTableWrapperProps) {
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);

  const handleClearSelection = () => {
    setSelectedEpisodeIds([]);
  };

  return (
    <div className="space-y-4">
      <EpisodesBulkActionsBar
        selectedEpisodeIds={selectedEpisodeIds}
        onClearSelection={handleClearSelection}
      />
      
      <EpisodesTable
        episodes={episodes}
        selectedEpisodeIds={selectedEpisodeIds}
        onSelectionChange={setSelectedEpisodeIds}
      />
    </div>
  );
}