import { useState } from 'react';
import type { S3FileInfo } from '@/lib/services/s3-service-types';

/**
 * Custom hook to manage dialog states for file viewer and deletion confirmations
 *
 * @returns Dialog state and control functions
 */
export function useDialogState() {
  const [selectedFile, setSelectedFile] = useState<S3FileInfo | null>(null);
  const [fileToDelete, setFileToDelete] = useState<S3FileInfo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const openViewer = (file: S3FileInfo) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  const openDeleteDialog = (file: S3FileInfo) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const openDeleteAllDialog = () => {
    setDeleteAllDialogOpen(true);
  };

  const closeAllDialogs = () => {
    setViewerOpen(false);
    setDeleteDialogOpen(false);
    setDeleteAllDialogOpen(false);
    setSelectedFile(null);
    setFileToDelete(null);
  };

  return {
    selectedFile,
    fileToDelete,
    viewerOpen,
    deleteDialogOpen,
    deleteAllDialogOpen,
    openViewer,
    openDeleteDialog,
    openDeleteAllDialog,
    closeAllDialogs,
    setViewerOpen,
    setDeleteDialogOpen,
    setDeleteAllDialogOpen
  };
}
