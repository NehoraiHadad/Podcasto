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
import { Card, CardContent } from '@/components/ui/card';
import { EpisodeActionsMenu } from '@/components/admin/action-menus';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { ContentDateRangeBadge } from '@/components/episodes/content-date-range-badge';
import { StatusCell } from '@/components/admin/shared/status-cell';
import { SelectAllCheckbox } from '@/components/admin/shared/select-all-checkbox';
import { useTableSelection } from '@/components/admin/shared/hooks/use-table-selection';
import { formatDuration } from '@/lib/utils/table-utils';
import { StageBadge } from '@/components/admin/processing/stage-badge';
import { ProcessingStage } from '@/types/processing';

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
  current_stage?: string | null;
  last_stage_update?: string | null;
  processing_started_at?: string | null;
  podcast_title?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface EpisodesTableProps {
  episodes: Episode[];
  selectedEpisodeIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

/**
 * Mobile card view for a single episode
 */
function EpisodeMobileCard({
  episode,
  isSelected,
  onSelect
}: {
  episode: Episode;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(!!checked)}
              aria-label={`Select episode: ${episode.title}`}
            />
          </div>

          {/* Cover Image */}
          <div className="flex-shrink-0">
            {episode.cover_image ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-md">
                <Image
                  src={episode.cover_image}
                  alt={`${episode.title} cover`}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/admin/episodes/${episode.id}`}
                className="font-medium text-sm hover:underline line-clamp-2"
              >
                {episode.title}
              </Link>
              <EpisodeActionsMenu episode={episode} />
            </div>

            <Link
              href={`/admin/podcasts/${episode.podcast_id}`}
              className="text-xs text-muted-foreground hover:underline block mt-1"
            >
              {episode.podcast_title}
            </Link>

            <div className="flex flex-wrap gap-2 mt-2">
              <StatusCell status={episode.status} metadata={episode.metadata} />
              {episode.current_stage && (
                <StageBadge stage={episode.current_stage as ProcessingStage} variant="compact" />
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              {episode.duration && (
                <span>{formatDuration(episode.duration)}</span>
              )}
              <ContentDateRangeBadge
                startDate={episode.content_start_date}
                endDate={episode.content_end_date}
              />
              <EpisodeDateBadge
                publishedAt={episode.published_at}
                createdAt={episode.created_at}
                variant="compact"
                showRelativeTime={true}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Episodes table component for admin dashboard
 * Displays episodes with selection, status, and action capabilities
 * Responsive: Shows table on desktop, cards on mobile
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
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-md">
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
              <TableHead>Current Stage</TableHead>
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
                  {episode.current_stage ? (
                    <StageBadge stage={episode.current_stage as ProcessingStage} variant="compact" />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
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

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="mb-3 p-3 border rounded-md bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SelectAllCheckbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : 'Select all'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {episodes.map((episode) => (
          <EpisodeMobileCard
            key={episode.id}
            episode={episode}
            isSelected={selectedIds.includes(episode.id)}
            onSelect={(checked) => handleItemSelect(episode.id, checked)}
          />
        ))}
      </div>
    </>
  );
}
