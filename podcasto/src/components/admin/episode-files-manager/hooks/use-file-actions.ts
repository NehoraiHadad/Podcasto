import { useState } from 'react';
import { toast } from 'sonner';
import type { S3FileInfo } from '@/lib/services/s3-service-types';
import { deleteS3File, deleteAllEpisodeS3Files } from '@/lib/actions/episode/s3-file-actions';

interface UseFileActionsProps {
  episodeId: string;
  podcastId: string;
  loadFiles: () => Promise<void>;
  openViewer: (file: S3FileInfo) => void;
  openDeleteDialog: (file: S3FileInfo) => void;
  openDeleteAllDialog: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setDeleteAllDialogOpen: (open: boolean) => void;
  fileToDelete: S3FileInfo | null;
  filesCount: number;
}

/**
 * Custom hook to manage file actions (view, delete single, delete all)
 *
 * @param props - Configuration and callback functions
 * @returns Action handlers and deleting state
 */
export function useFileActions({
  episodeId,
  podcastId,
  loadFiles,
  openViewer,
  openDeleteDialog,
  openDeleteAllDialog,
  setDeleteDialogOpen,
  setDeleteAllDialogOpen,
  fileToDelete,
  filesCount
}: UseFileActionsProps) {
  const [deleting, setDeleting] = useState(false);

  const handleViewFile = (file: S3FileInfo) => {
    openViewer(file);
  };

  const handleDeleteFile = (file: S3FileInfo) => {
    openDeleteDialog(file);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setDeleting(true);

    const result = await deleteS3File(fileToDelete.key, episodeId);

    if (result.success) {
      toast.success('File deleted', {
        description: `${fileToDelete.name} has been deleted successfully.`
      });
      await loadFiles();
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to delete file'
      });
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  const confirmDeleteAllFiles = async () => {
    setDeleting(true);

    const result = await deleteAllEpisodeS3Files(episodeId, podcastId);

    if (result.success && result.data) {
      toast.success('All files deleted', {
        description: `${result.data.deletedCount} file(s) have been deleted successfully.`
      });
      await loadFiles();
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to delete files'
      });
    }

    setDeleting(false);
    setDeleteAllDialogOpen(false);
  };

  return {
    deleting,
    handleViewFile,
    handleDeleteFile,
    confirmDeleteFile,
    confirmDeleteAllFiles
  };
}
