'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
import { deleteEpisode, regenerateEpisodeAudio } from '@/lib/actions/episode-actions';
import { toast } from 'sonner';

// Define the expected episode type for the component
interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  audio_url: string | null;
  cover_image?: string | null;
  status?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

interface EpisodeActionsMenuProps {
  episode: Episode;
}

export function EpisodeActionsMenu({ episode }: EpisodeActionsMenuProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Status-dependent actions
  const canRegenerate = episode.status?.toLowerCase() === 'failed' || 
                        episode.status?.toLowerCase() === 'published';
  
  // Handle episode deletion
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteEpisode(episode.id);
      toast.success('Episode deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting episode:', error);
      toast.error('Failed to delete episode');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle episode audio regeneration
  const handleRegenerateAudio = async () => {
    try {
      setIsLoading(true);
      await regenerateEpisodeAudio(episode.id);
      toast.success('Audio regeneration started');
      router.refresh();
    } catch (error) {
      console.error('Error regenerating audio:', error);
      toast.error('Failed to regenerate audio');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* View episode */}
          <DropdownMenuItem asChild>
            <a href={`/podcasts/${episode.podcast_id}/${episode.id}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <Play className="mr-2 h-4 w-4" />
              <span>Play Episode</span>
            </a>
          </DropdownMenuItem>
          
          {/* Edit episode */}
          <DropdownMenuItem onClick={() => router.push(`/admin/episodes/${episode.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Details</span>
          </DropdownMenuItem>
          
          {/* View cover image if available */}
          {episode.cover_image && (
            <DropdownMenuItem asChild>
              <a href={episode.cover_image} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>View Cover Image</span>
              </a>
            </DropdownMenuItem>
          )}
          
          {/* Regenerate audio */}
          {canRegenerate && (
            <DropdownMenuItem
              onClick={handleRegenerateAudio}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Regenerate Audio</span>
            </DropdownMenuItem>
          )}
          
          {/* Audio file direct link */}
          <DropdownMenuItem asChild>
            <a href={episode.audio_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Audio File</span>
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Delete episode */}
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600"
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Episode</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete episode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{episode.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 