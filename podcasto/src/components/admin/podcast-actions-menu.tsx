'use client';

import Link from 'next/link';
import { Trash2, Play, Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generatePodcastEpisode } from '@/lib/actions/podcast/generate';
import { deletePodcast } from '@/lib/actions/podcast/delete';
import { PodcastStatusIndicator } from './podcast-status-indicator';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Podcast {
  id: string;
  title: string;
  status?: string;
  timestamp?: string;
  // Add other known properties
  [key: string]: string | number | boolean | null | undefined;
}

interface PodcastActionsMenuProps {
  podcast: Podcast;
  onStatusChange?: () => void;
}

/**
 * Client component for podcast actions menu
 * This isolates the interactive dropdown menu functionality
 */
export function PodcastActionsMenu({ podcast, onStatusChange }: PodcastActionsMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // TypeScript explicitly type the states to allow undefined values
  const [generatedEpisodeId, setGeneratedEpisodeId] = useState<string | undefined>(undefined);
  const [generatedTimestamp, setGeneratedTimestamp] = useState<string | undefined>(undefined);
  const [generatedStatus, setGeneratedStatus] = useState<string | undefined>(undefined);
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deletePodcast(podcast.id);
      
      if (result.success) {
        toast.success(`Podcast "${podcast.title}" deleted successfully`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete podcast');
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleGenerateEpisode = async () => {
    try {
      setIsGenerating(true);
      
      // Reset any previous episode indicator state before generating a new one
      setGeneratedEpisodeId(undefined);
      setGeneratedTimestamp(undefined);
      setGeneratedStatus(undefined);
      setShowStatusIndicator(false);
      
      // Call the server action to generate the podcast episode
      const result = await generatePodcastEpisode(podcast.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        // Store the episode info for status checking
        if (result.episodeId) setGeneratedEpisodeId(result.episodeId);
        if (result.timestamp) setGeneratedTimestamp(result.timestamp);
        // Set initial status to 'pending' since it's not returned from the API
        setGeneratedStatus('pending');
        setShowStatusIndicator(true);
        
        toast.success(result.message || 'Episode generation started', {
          description: 'You can see the generation status indicator next to this podcast.'
        });
        
        // Call onStatusChange to refresh the parent component if provided
        if (onStatusChange) {
          onStatusChange();
        }
      }
    } catch (error) {
      console.error('Error generating episode:', error);
      toast.error('Failed to generate episode');
    } finally {
      setIsGenerating(false);
      setIsOpen(false);
    }
  };
  
  // Stabilize the status change handler with useCallback
  const handleStatusChange = useCallback((newStatus: string) => {
    // If this is for our generated episode, update the local status
    if (showStatusIndicator && generatedEpisodeId && newStatus) {
      setGeneratedStatus(newStatus);
      
      // Auto-hide completed statuses
      const finalStatuses = ['completed', 'complete', 'error'];
      if (finalStatuses.includes(newStatus.toLowerCase())) {
        setShowStatusIndicator(false);
      }
    }
    
    // Trigger parent refresh when status changes
    if (onStatusChange) onStatusChange();
  }, [showStatusIndicator, generatedEpisodeId, onStatusChange]);

  // Determine which set of status info to use:
  // 1. If we just generated a new episode, use that info
  // 2. ONLY otherwise, use the podcast's latest episode info
  const isActiveGeneration = showStatusIndicator && generatedEpisodeId;
  const statusToShow = isActiveGeneration ? generatedStatus : podcast.status;
  const timestampToShow = isActiveGeneration ? generatedTimestamp : podcast.timestamp;
  const episodeIdToShow = isActiveGeneration ? generatedEpisodeId : undefined;
  
  // Determine if we should show any status indicator
  const pendingStatuses = ['pending'];
  const shouldShowStatus = Boolean(
    (showStatusIndicator && generatedEpisodeId) ||
    (podcast.status && 
     pendingStatuses.includes(podcast.status.toLowerCase()) && 
     podcast.timestamp && 
     !showStatusIndicator) // Only use podcast status if not showing a generated one
  );
  
  const isPending = podcast.status === 'pending';
  
  return (
    <>
      <div className="flex items-center gap-2">
        {shouldShowStatus && (
          <PodcastStatusIndicator 
            podcastId={podcast.id}
            episodeId={episodeIdToShow}
            timestamp={timestampToShow}
            initialStatus={statusToShow || 'pending'}
            onStatusChange={handleStatusChange}
          />
        )}
        
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/podcasts/${podcast.id}`} className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                <span>View</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleGenerateEpisode}
              disabled={isGenerating || (generatedStatus?.toLowerCase() === 'pending')}
              className="flex items-center cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate Episode Now'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/podcasts/${podcast.id}`}>
                <Play className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/podcasts/${podcast.id}/episodes`}>
                <Play className="mr-2 h-4 w-4" />
                View Episodes
              </Link>
            </DropdownMenuItem>
            
            {isPending && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-amber-500">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Processing...
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the podcast "{podcast.title}" and all its episodes.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 