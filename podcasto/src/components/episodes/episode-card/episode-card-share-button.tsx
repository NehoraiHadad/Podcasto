'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useEpisodeCard } from './episode-card';
import { toast } from 'sonner';

/**
 * EpisodeCard.ShareButton - Share button for episode
 */
export function EpisodeCardShareButton() {
  const { episode, podcastId } = useEpisodeCard();

  const handleShare = async () => {
    const url = new URL(
      `/podcasts/${podcastId}/${episode.id}`,
      window.location.origin
    ).toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: episode.title,
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
      variant="ghost"
      size="icon"
      className="h-8 w-8 ml-3 flex-shrink-0"
      title="Share episode"
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
