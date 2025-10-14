import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

/**
 * EpisodeCard.ShareButton - Share button for episode
 */
export function EpisodeCardShareButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 ml-3 flex-shrink-0"
      title="Share episode"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
