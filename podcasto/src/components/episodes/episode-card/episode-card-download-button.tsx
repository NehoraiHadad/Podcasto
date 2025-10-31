'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useEpisodeCard } from './episode-card';
import { toast } from 'sonner';
import { getEpisodeAudioUrl } from '@/lib/actions/episode/audio-actions';
import { downloadFile } from '@/lib/utils/download-utils';

/**
 * EpisodeCard.DownloadButton - Download button for episode audio
 * Fetches the audio URL and triggers browser download
 */
export function EpisodeCardDownloadButton() {
  const { episode } = useEpisodeCard();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Get the audio URL (CloudFront or S3 presigned)
      const { url, error } = await getEpisodeAudioUrl(episode.id);

      if (error || !url) {
        toast.error(error || 'Failed to get audio URL');
        return;
      }

      // Generate filename (sanitized)
      const sanitize = (str: string) =>
        str
          .replace(/[<>:"/\\|?*]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const filename = `${sanitize(episode.title)}.${episode.audio_format || 'mp3'}`;

      // Trigger download
      downloadFile(url, filename);

      toast.success('Download started!');
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download episode');
    } finally {
      setIsDownloading(false);
    }
  };

  // Don't show button if there's no audio URL
  if (!episode.audio_url) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 flex-shrink-0"
      title="Download episode"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
