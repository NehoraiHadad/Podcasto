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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Don't render if no episodes selected
  if (selectedEpisodeIds.length === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    if (!confirmDelete) {
      toast.error('Please confirm that you understand files will be permanently deleted from S3');
      return;
    }

    try {
      setIsLoading(true);

      const result = await deleteEpisodesBulk({ episodeIds: selectedEpisodeIds });

      if (result.success) {
        toast.success(`Successfully deleted ${result.deleted.length} episodes (including all S3 files)`);
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
      setConfirmDelete(false);
    }
  };

  // Reset confirmation when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setConfirmDelete(false);
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
        onOpenChange={handleDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedEpisodeIds.length} episode{selectedEpisodeIds.length !== 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <span className="font-semibold">{selectedEpisodeIds.length} episode{selectedEpisodeIds.length !== 1 ? 's' : ''}</span>?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Warning: This will permanently delete for each episode:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-200">
                  <li>Episode record from database</li>
                  <li>Audio files from AWS S3</li>
                  <li>Cover images from AWS S3</li>
                  <li>Transcripts and metadata from AWS S3</li>
                </ul>
                {selectedEpisodeIds.length > 10 && (
                  <p className="mt-2 text-yellow-900 dark:text-yellow-100 text-xs">
                    ⏱️ Note: Deleting {selectedEpisodeIds.length} episodes may take some time to complete.
                  </p>
                )}
                <p className="mt-2 font-semibold text-red-600 dark:text-red-400">This action cannot be undone!</p>
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="confirm-bulk-delete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="confirm-bulk-delete"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I understand that all {selectedEpisodeIds.length} episode{selectedEpisodeIds.length !== 1 ? 's' : ''} and their files will be permanently deleted from AWS S3
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading || !confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : `Delete ${selectedEpisodeIds.length} Permanently`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}