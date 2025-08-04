"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { unstable_noStore as noStore } from 'next/cache';
import { episodesApi, podcastsApi } from '@/lib/db/api';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EpisodeActionsMenu } from './episode-actions-menu';
import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { sortEpisodesByDate } from '@/lib/utils/episode-utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertCircle, Trash2, RotateCcw } from 'lucide-react';

// Define the expected episode type for the component
interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string | null;
  language: string | null;
  audio_url: string;
  duration: number | null;
  created_at: string | null;
  published_at: string | null;
  status: string | null;
  metadata: string | null;
  cover_image: string | null;
  podcast_title?: string;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Client component that fetches and displays a list of episodes with multi-select functionality
 */
export function ServerEpisodesList() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch episodes on component mount
  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch episodes from the database
      const allEpisodes = await episodesApi.getAllEpisodes();
      
      // Fetch all podcasts to get their titles
      const allPodcasts = await podcastsApi.getAllPodcasts();
      const podcastsMap = new Map(allPodcasts.map(podcast => [podcast.id, podcast.title]));
      
      // Convert episodes to the expected format and sort by date
      const formattedEpisodes: Episode[] = sortEpisodesByDate(
        allEpisodes.map(episode => ({
          id: episode.id,
          podcast_id: episode.podcast_id || '',
          title: episode.title,
          description: episode.description,
          language: episode.language,
          audio_url: episode.audio_url,
          duration: episode.duration,
          created_at: episode.created_at ? episode.created_at.toISOString() : null,
          published_at: episode.published_at ? episode.published_at.toISOString() : null,
          status: episode.status,
          metadata: episode.metadata,
          cover_image: episode.cover_image,
          podcast_title: episode.podcast_id ? podcastsMap.get(episode.podcast_id) || 'Unknown Podcast' : 'Unknown Podcast',
        }))
      );
      
      setEpisodes(formattedEpisodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load episodes');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle checkbox selection with Shift key support
  const handleEpisodeSelect = (episodeId: string, index: number, checked: boolean) => {
    const newSelected = new Set(selectedEpisodes);
    
    if (checked) {
      // If Shift is held and we have a last selected index, select range
      if (lastSelectedIndex !== null && (window.event as KeyboardEvent).shiftKey) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        
        for (let i = start; i <= end; i++) {
          newSelected.add(episodes[i].id);
        }
      } else {
        newSelected.add(episodeId);
      }
      setLastSelectedIndex(index);
    } else {
      newSelected.delete(episodeId);
      if (lastSelectedIndex === index) {
        setLastSelectedIndex(null);
      }
    }
    
    setSelectedEpisodes(newSelected);
  };

  // Handle "select all" checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEpisodes(new Set(episodes.map(ep => ep.id)));
    } else {
      setSelectedEpisodes(new Set());
    }
    setLastSelectedIndex(null);
  };

  // Check if all episodes are selected
  const allSelected = episodes.length > 0 && selectedEpisodes.size === episodes.length;
  const someSelected = selectedEpisodes.size > 0 && selectedEpisodes.size < episodes.length;

  // Bulk delete episodes
  const handleBulkDelete = async () => {
    if (selectedEpisodes.size === 0) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedEpisodes).map(episodeId =>
        episodesApi.deleteEpisode(episodeId)
      );
      
      await Promise.all(deletePromises);
      
      // Remove deleted episodes from state
      setEpisodes(prev => prev.filter(ep => !selectedEpisodes.has(ep.id)));
      setSelectedEpisodes(new Set());
      setLastSelectedIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete episodes');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk reset status to pending
  const handleBulkReset = async () => {
    if (selectedEpisodes.size === 0) return;
    
    try {
      const resetPromises = Array.from(selectedEpisodes).map(episodeId =>
        episodesApi.updateEpisode(episodeId, { status: 'pending' })
      );
      
      await Promise.all(resetPromises);
      
      // Update episodes in state
      setEpisodes(prev => prev.map(ep => 
        selectedEpisodes.has(ep.id) ? { ...ep, status: 'pending' } : ep
      ));
      setSelectedEpisodes(new Set());
      setLastSelectedIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset episodes');
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-md p-4">
          <p className="text-muted-foreground">Loading episodes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load episodes. Please try again later.</p>
        <p className="text-xs text-red-500 mt-2">{error}</p>
        <Button onClick={fetchEpisodes} className="mt-2">Retry</Button>
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No episodes found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedEpisodes.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">
              {selectedEpisodes.size} episode{selectedEpisodes.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkReset}
              disabled={isDeleting}
            >
              <RotateCcw size={16} className="mr-1" />
              Reset to Pending
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 size={16} className="mr-1" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Episodes</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedEpisodes.size} episode{selectedEpisodes.size !== 1 ? 's' : ''}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Podcast</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {episodes.map((episode, index) => (
              <TableRow key={episode.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEpisodes.has(episode.id)}
                    onCheckedChange={(checked) => handleEpisodeSelect(episode.id, index, checked as boolean)}
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
                  {episode.cover_image && (
                    <div className="mt-1">
                      <a 
                        href={episode.cover_image} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View full image
                      </a>
                    </div>
                  )}
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
    </div>
  );
} 