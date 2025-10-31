'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface EpisodeShareButtonProps {
  episodeId: string;
  episodeTitle: string;
  podcastId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

/**
 * Standalone episode share button
 * Can be used outside of EpisodeCard context
 */
export function EpisodeShareButton({
  episodeId,
  episodeTitle,
  podcastId,
  variant = 'outline',
  size = 'default',
  showLabel = true
}: EpisodeShareButtonProps) {
  const handleShare = async () => {
    const url = new URL(
      `/podcasts/${podcastId}/${episodeId}`,
      window.location.origin
    ).toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: episodeTitle,
          url: url,
        });
        toast.success('Episode shared!');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share episode.');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      {showLabel && (size !== 'icon') && <span>Share</span>}
    </Button>
  );
}
