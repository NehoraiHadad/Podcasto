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
import { Badge } from '@/components/ui/badge';
import { EpisodeActionsMenu } from './action-menus';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { ContentDateRangeBadge } from '@/components/episodes/content-date-range-badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

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

interface ClientEpisodesTableProps {
  episodes: Episode[];
  selectedEpisodeIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function ClientEpisodesTable({ 
  episodes, 
  selectedEpisodeIds, 
  onSelectionChange 
}: ClientEpisodesTableProps) {
  // Format duration from seconds to mm:ss
  const formatDuration = (durationInSeconds: number | null): string => {
    if (!durationInSeconds) return 'Unknown';
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper to extract error message from metadata
  const getErrorMessage = (metadata: string | null): string | null => {
    if (!metadata) return null;
    try {
      const meta = JSON.parse(metadata);
      return meta.error || null;
    } catch {
      return null;
    }
  };

  // Format status with badge and error tooltip if failed
  const renderStatus = (status: string | null, metadata: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (status.toLowerCase() === 'failed') {
      const errorMsg = getErrorMessage(metadata);
      return (
        <div className="flex items-center gap-1">
          <Badge variant="destructive">Failed</Badge>
          {errorMsg && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 cursor-pointer text-red-500">
                  <AlertCircle size={16} />
                </span>
              </TooltipTrigger>
              <TooltipContent sideOffset={4}>
                <span className="max-w-xs break-words whitespace-pre-line">{errorMsg}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }
    switch (status.toLowerCase()) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Published</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle individual episode selection
  const handleEpisodeSelect = (episodeId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedEpisodeIds, episodeId]);
    } else {
      onSelectionChange(selectedEpisodeIds.filter(id => id !== episodeId));
    }
  };

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(episodes.map(episode => episode.id));
    } else {
      onSelectionChange([]);
    }
  };

  const isAllSelected = episodes.length > 0 && selectedEpisodeIds.length === episodes.length;
  const isIndeterminate = selectedEpisodeIds.length > 0 && selectedEpisodeIds.length < episodes.length;

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all episodes"
                ref={(ref) => {
                  if (ref) {
                    const checkbox = ref.querySelector('input[type="checkbox"]') as HTMLInputElement;
                    if (checkbox) checkbox.indeterminate = isIndeterminate;
                  }
                }}
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
                  checked={selectedEpisodeIds.includes(episode.id)}
                  onCheckedChange={(checked) => handleEpisodeSelect(episode.id, !!checked)}
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
                {renderStatus(episode.status, episode.metadata)}
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