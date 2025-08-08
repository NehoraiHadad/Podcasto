'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
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
import { deleteEpisodesBulk } from '@/lib/actions/episode-actions';
import { toast } from 'sonner';

interface EpisodesBulkActionsBarProps {
  selectedEpisodeIds: string[];
  onClearSelection: () => void;
}

export function EpisodesBulkActionsBar({ 
  selectedEpisodeIds, 
  onClearSelection 
}: EpisodesBulkActionsBarProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't render if no episodes selected
  if (selectedEpisodeIds.length === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    try {
      setIsLoading(true);
      
      const result = await deleteEpisodesBulk({ episodeIds: selectedEpisodeIds });
      
      if (result.success) {
        toast.success(`Successfully deleted ${result.deleted.length} episodes`);
      } else if (result.deleted.length > 0) {
        // Partial success
        toast.warning(
          `Deleted ${result.deleted.length} episodes, but ${result.failed.length} failed`,
          {
            description: result.failed.length > 0 
              ? `First error: ${result.failed[0].error}` 
              : undefined
          }
        );
      } else {
        // Complete failure
        toast.error(
          `Failed to delete episodes`,
          {
            description: result.failed.length > 0 
              ? `Error: ${result.failed[0].error}` 
              : undefined
          }
        );
      }

      // Clear selection and refresh regardless of partial/full success
      onClearSelection();
      router.refresh();
      
    } catch (error) {
      console.error('Error during bulk delete:', error);
      toast.error('An unexpected error occurred during bulk delete');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedEpisodeIds.length} episode{selectedEpisodeIds.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isLoading}
              className="h-8"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete episodes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEpisodeIds.length} episode{selectedEpisodeIds.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all associated files from storage.
              {selectedEpisodeIds.length > 10 && (
                <div className="mt-2 text-yellow-600">
                  Note: Deleting {selectedEpisodeIds.length} episodes may take some time to complete.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : `Delete ${selectedEpisodeIds.length} Episode${selectedEpisodeIds.length !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}