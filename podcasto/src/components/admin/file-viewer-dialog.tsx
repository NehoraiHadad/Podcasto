'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { getS3FileContent } from '@/lib/actions/episode/s3-file-actions';
import type { S3FileInfo } from '@/lib/services/s3-file-service';

interface FileViewerDialogProps {
  file: S3FileInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileViewerDialog({ file, open, onOpenChange }: FileViewerDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load content when dialog opens
  useEffect(() => {
    if (open && file) {
      const loadContent = async () => {
        console.log('[FileViewer] Loading file:', file.key);
        setLoading(true);
        setError(null);
        setContent(null);
        setSignedUrl(null);

        try {
          const result = await getS3FileContent(file.key);
          console.log('[FileViewer] Result:', result);

          if (result.success && result.data) {
            if (result.data.isText) {
              console.log('[FileViewer] Setting text content');
              setContent(result.data.content);
            } else {
              console.log('[FileViewer] Setting signed URL');
              setSignedUrl(result.data.signedUrl || null);
            }
          } else {
            console.error('[FileViewer] Error:', result.error);
            setError(result.error || 'Failed to load file');
          }
        } catch (err) {
          console.error('[FileViewer] Exception:', err);
          setError('An error occurred while loading the file');
        }

        setLoading(false);
      };

      loadContent();
    } else if (!open) {
      // Reset state when closing
      setContent(null);
      setSignedUrl(null);
      setError(null);
    }
  }, [open, file]);

  if (!file) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      );
    }

    // Text content
    if (content) {
      const isJson = file.name.endsWith('.json');
      const displayContent = isJson ? formatJson(content) : content;

      return (
        <div className="space-y-4">
          <pre className="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-xs">
            <code>{displayContent}</code>
          </pre>
          <Button
            onClick={() => {
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      );
    }

    // Binary file with signed URL
    if (signedUrl) {
      return (
        <div className="space-y-4">
          {file.type === 'audio' && (
            <audio controls className="w-full">
              <source src={signedUrl} type="audio/wav" />
              <source src={signedUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}

          {file.type === 'image' && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={file.name}
                className="max-h-[500px] rounded-md object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={signedUrl} download={file.name}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </a>
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
          <DialogDescription>
            {formatBytes(file.size)} • Last modified:{' '}
            {new Date(file.lastModified).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
