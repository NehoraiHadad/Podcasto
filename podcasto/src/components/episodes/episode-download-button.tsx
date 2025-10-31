'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '@/lib/utils/download-utils';

interface EpisodeDownloadButtonProps {
  episodeId: string;
  episodeTitle: string;
  audioUrl: string;
  audioFormat?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

/**
 * Standalone episode download button
 * Can be used outside of EpisodeCard context
 */
export function EpisodeDownloadButton({
  episodeTitle,
  audioUrl,
  audioFormat = 'mp3',
  variant = 'outline',
  size = 'default',
  showLabel = true
}: EpisodeDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Sanitize filename
      const sanitize = (str: string) =>
        str
          .replace(/[<>:"/\\|?*]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const filename = `${sanitize(episodeTitle)}.${audioFormat}`;

      // Trigger download
      downloadFile(audioUrl, filename);

      toast.success('Download started!');
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download episode');
    } finally {
      setIsDownloading(false);
    }
  };

  // Don't show button if there's no audio URL
  if (!audioUrl) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showLabel && (size !== 'icon') && <span>Download</span>}
    </Button>
  );
}
