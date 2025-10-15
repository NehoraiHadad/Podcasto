'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EpisodeActionsMenu } from '@/components/admin/action-menus';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { ContentDateRangeBadge } from '@/components/episodes/content-date-range-badge';
import { StatusCell } from '@/components/admin/shared/status-cell';
import { SelectAllCheckbox } from '@/components/admin/shared/select-all-checkbox';
import { useTableSelection } from '@/components/admin/shared/hooks/use-table-selection';
import { formatDuration } from '@/lib/utils/table-utils';

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

interface EpisodesTableProps {
  episodes: Episode[];
  selectedEpisodeIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

/**
 * Episodes table component for admin dashboard
 * Displays episodes with selection, status, and action capabilities
 */
export function EpisodesTable({
  episodes,
  selectedEpisodeIds,
  onSelectionChange
}: EpisodesTableProps) {
  const { selectedIds, handleItemSelect, handleSelectAll, isAllSelected, isIndeterminate } =
    useTableSelection({
      items: episodes,
      getItemId: (episode) => episode.id,
      initialSelectedIds: selectedEpisodeIds,
      onSelectionChange
    });

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <SelectAllCheckbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Cover</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Podcast</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Content Period</TableHead>
            <TableHead>Published Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {episodes.map((episode) => (
            <TableRow key={episode.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(episode.id)}
                  onCheckedChange={(checked) => handleItemSelect(episode.id, !!checked)}
                  aria-label={`Select episode: ${episode.title}`}
                />
              </TableCell>
              <TableCell>
                {episode.cover_image ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <Image
                      src={episode.cover_image}
                      alt={`${episode.title} cover`}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/admin/episodes/${episode.id}`} className="hover:underline">
                  {episode.title}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/admin/podcasts/${episode.podcast_id}`} className="hover:underline">
                  {episode.podcast_title}
                </Link>
              </TableCell>
              <TableCell>
                {formatDuration(episode.duration)}
              </TableCell>
              <TableCell>
                <StatusCell status={episode.status} metadata={episode.metadata} />
              </TableCell>
              <TableCell>
                <ContentDateRangeBadge
                  startDate={episode.content_start_date}
                  endDate={episode.content_end_date}
                />
              </TableCell>
              <TableCell>
                <EpisodeDateBadge
                  publishedAt={episode.published_at}
                  createdAt={episode.created_at}
                  variant="compact"
                  showRelativeTime={true}
                />
              </TableCell>
              <TableCell className="text-right">
                <EpisodeActionsMenu episode={episode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
