import { EpisodeDateBadge } from '@/components/episodes/episode-date-badge';
import { ContentDateRangeBadge } from '@/components/episodes/content-date-range-badge';
import { useEpisodeCard } from './episode-card';

/**
 * EpisodeCard.Badges - Displays episode date and content date range badges
 */
export function EpisodeCardBadges() {
  const { episode } = useEpisodeCard();

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <EpisodeDateBadge
        publishedAt={episode.published_at}
        createdAt={episode.created_at}
        variant="default"
        showRelativeTime={true}
      />
      <ContentDateRangeBadge
        startDate={episode.content_start_date ? episode.content_start_date.toISOString() : null}
        endDate={episode.content_end_date ? episode.content_end_date.toISOString() : null}
      />
    </div>
  );
}
