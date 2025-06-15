import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { formatEpisodeDate, isNewEpisode } from '@/lib/utils/episode-utils';
import { cn } from '@/lib/utils';

interface EpisodeDateBadgeProps {
  publishedAt: Date | string | null;
  createdAt?: Date | string | null;
  showNewBadge?: boolean;
  showRelativeTime?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function EpisodeDateBadge({
  publishedAt,
  createdAt,
  showNewBadge = true,
  showRelativeTime = true,
  variant = 'default',
  className
}: EpisodeDateBadgeProps) {
  const isNew = showNewBadge && isNewEpisode(publishedAt);
  const formattedDate = formatEpisodeDate(publishedAt, createdAt, {
    showRelative: showRelativeTime,
    format: variant === 'detailed' ? 'long' : 'short'
  });

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isNew && (
          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-0.5">
            NEW
          </Badge>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          {isNew && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white">
              NEW EPISODE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isNew && (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          NEW
        </Badge>
      )}
      <Badge variant="outline" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {formattedDate}
      </Badge>
    </div>
  );
} 