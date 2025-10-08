'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  File,
  FileText,
  FileAudio,
  Image as ImageIcon,
  FileJson,
  Trash2,
  Eye,
  Loader2,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { listEpisodeS3Files, deleteS3File, deleteAllEpisodeS3Files } from '@/lib/actions/episode/s3-file-actions';
import type { S3FileInfo } from '@/lib/services/s3-file-service';
import { FileViewerDialog } from './file-viewer-dialog';
import { toast } from 'sonner';

interface EpisodeFilesManagerProps {
  episodeId: string;
  podcastId: string;
}

export function EpisodeFilesManager({ episodeId, podcastId }: EpisodeFilesManagerProps) {
  const [files, setFiles] = useState<S3FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<S3FileInfo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<S3FileInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [episodeId, podcastId]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    const result = await listEpisodeS3Files(episodeId, podcastId);

    if (result.success && result.data) {
      setFiles(result.data);
    } else {
      setError(result.error || 'Failed to load files');
    }

    setLoading(false);
  };

  const handleViewFile = (file: S3FileInfo) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  const handleDeleteFile = (file: S3FileInfo) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setDeleting(true);

    const result = await deleteS3File(fileToDelete.key, episodeId);

    if (result.success) {
      toast.success('File deleted', {
        description: `${fileToDelete.name} has been deleted successfully.`
      });
      await loadFiles(); // Refresh list
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to delete file'
      });
    }

    setDeleting(false);
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const confirmDeleteAllFiles = async () => {
    setDeleting(true);

    const result = await deleteAllEpisodeS3Files(episodeId, podcastId);

    if (result.success && result.data) {
      toast.success('All files deleted', {
        description: `${result.data.deletedCount} file(s) have been deleted successfully.`
      });
      await loadFiles(); // Refresh list
    } else {
      toast.error('Error', {
        description: result.error || 'Failed to delete files'
      });
    }

    setDeleting(false);
    setDeleteAllDialogOpen(false);
  };

  const getFileIcon = (type: S3FileInfo['type']) => {
    switch (type) {
      case 'content':
        return <FileJson className="h-5 w-5 text-blue-500" />;
      case 'audio':
        return <FileAudio className="h-5 w-5 text-purple-500" />;
      case 'transcript':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type: S3FileInfo['type']) => {
    switch (type) {
      case 'content':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'audio':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'transcript':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'image':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Episode Files</CardTitle>
          <CardDescription>Manage S3 files for this episode</CardDescription>
        </CardHeader>
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
        <CardHeader>
          <CardTitle>Episode Files</CardTitle>
          <CardDescription>Manage S3 files for this episode</CardDescription>
        </CardHeader>
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
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Episode Files</CardTitle>
              <CardDescription>
                {files.length} file(s) in S3 storage
              </CardDescription>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <Button onClick={loadFiles} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                Refresh
              </Button>
              {files.length > 0 && (
                <Button
                  onClick={() => setDeleteAllDialogOpen(true)}
                  variant="destructive"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Delete All</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No files found for this episode
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 hover:bg-muted/50 gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <Badge className={`${getTypeBadgeColor(file.type)} w-fit`} variant="secondary">
                          {file.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatBytes(file.size)} •{' '}
                        {new Date(file.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:ml-2 sm:flex-shrink-0">
                    <Button
                      onClick={() => handleViewFile(file)}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-initial"
                    >
                      <Eye className="h-4 w-4 sm:mr-0" />
                      <span className="ml-2 sm:hidden">View</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteFile(file)}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-0" />
                      <span className="ml-2 sm:hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Viewer Dialog */}
      <FileViewerDialog
        file={selectedFile}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      {/* Delete Single File Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{fileToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFile}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Files Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {files.length} file(s)?
              This will remove all content, audio, transcripts, and images for this episode.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAllFiles}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
