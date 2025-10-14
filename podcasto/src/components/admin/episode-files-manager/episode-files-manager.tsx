'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { FileViewerDialog } from '../file-viewer-dialog';
import { FilesCardHeader } from './components/files-card-header';
import { FilesEmptyState } from './components/files-empty-state';
import { FilesList } from './components/files-list';
import { DeleteFileDialog } from './components/delete-file-dialog';
import { DeleteAllDialog } from './components/delete-all-dialog';
import { useDialogState } from './hooks/use-dialog-state';
import { useFilesData } from './hooks/use-files-data';
import { useFileActions } from './hooks/use-file-actions';

interface EpisodeFilesManagerProps {
  episodeId: string;
  podcastId: string;
}

export function EpisodeFilesManager({ episodeId, podcastId }: EpisodeFilesManagerProps) {
  const dialogState = useDialogState();
  const { files, loading, error, loadFiles } = useFilesData({ episodeId, podcastId });

  const {
    deleting,
    handleViewFile,
    handleDeleteFile,
    confirmDeleteFile,
    confirmDeleteAllFiles
  } = useFileActions({
    episodeId,
    podcastId,
    loadFiles,
    openViewer: dialogState.openViewer,
    openDeleteDialog: dialogState.openDeleteDialog,
    openDeleteAllDialog: dialogState.openDeleteAllDialog,
    setDeleteDialogOpen: dialogState.setDeleteDialogOpen,
    setDeleteAllDialogOpen: dialogState.setDeleteAllDialogOpen,
    fileToDelete: dialogState.fileToDelete,
    filesCount: files.length
  });

  if (loading) {
    return (
      <Card>
        <FilesCardHeader
          filesCount={0}
          onRefresh={loadFiles}
          onDeleteAll={dialogState.openDeleteAllDialog}
          hasFiles={false}
        />
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <FilesCardHeader
          filesCount={0}
          onRefresh={loadFiles}
          onDeleteAll={dialogState.openDeleteAllDialog}
          hasFiles={false}
        />
        <CardContent>
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <FilesCardHeader
          filesCount={files.length}
          onRefresh={loadFiles}
          onDeleteAll={dialogState.openDeleteAllDialog}
          hasFiles={files.length > 0}
        />
        <CardContent>
          {files.length === 0 ? (
            <FilesEmptyState />
          ) : (
            <FilesList
              files={files}
              onView={handleViewFile}
              onDelete={handleDeleteFile}
            />
          )}
        </CardContent>
      </Card>

      <FileViewerDialog
        file={dialogState.selectedFile}
        open={dialogState.viewerOpen}
        onOpenChange={dialogState.setViewerOpen}
      />

      <DeleteFileDialog
        open={dialogState.deleteDialogOpen}
        file={dialogState.fileToDelete}
        deleting={deleting}
        onConfirm={confirmDeleteFile}
        onCancel={() => dialogState.setDeleteDialogOpen(false)}
      />

      <DeleteAllDialog
        open={dialogState.deleteAllDialogOpen}
        filesCount={files.length}
        deleting={deleting}
        onConfirm={confirmDeleteAllFiles}
        onCancel={() => dialogState.setDeleteAllDialogOpen(false)}
      />
    </>
  );
}
