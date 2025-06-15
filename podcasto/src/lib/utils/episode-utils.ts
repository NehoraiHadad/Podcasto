import { formatDistanceToNow, format, isWithinInterval, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Check if an episode is considered "new" (published within the last 7 days)
 */
export function isNewEpisode(publishedAt: Date | string | null): boolean {
  if (!publishedAt) return false;
  
  const publishDate = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const sevenDaysAgo = subDays(new Date(), 7);
  
  return isWithinInterval(publishDate, {
    start: sevenDaysAgo,
    end: new Date()
  });
}

/**
 * Format episode date for display with relative time
 */
export function formatEpisodeDate(
  publishedAt: Date | string | null,
  createdAt?: Date | string | null,
  options: {
    showRelative?: boolean;
    locale?: 'en' | 'he';
    format?: 'short' | 'long';
  } = {}
): string {
  const { showRelative = true, locale = 'en', format: dateFormat = 'short' } = options;
  
  // Use published_at if available, otherwise fall back to created_at
  const dateToUse = publishedAt || createdAt;
  if (!dateToUse) return 'No date';
  
  const date = typeof dateToUse === 'string' ? new Date(dateToUse) : dateToUse;
  
  if (showRelative) {
    const relativeTime = formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === 'he' ? he : undefined
    });
    
    if (dateFormat === 'long') {
      const fullDate = format(date, 'PPP', {
        locale: locale === 'he' ? he : undefined
      });
      return `${fullDate} (${relativeTime})`;
    }
    
    return relativeTime;
  }
  
  return format(date, dateFormat === 'long' ? 'PPP' : 'MMM d, yyyy', {
    locale: locale === 'he' ? he : undefined
  });
}

/**
 * Get episode age in days
 */
export function getEpisodeAgeInDays(publishedAt: Date | string | null): number {
  if (!publishedAt) return Infinity;
  
  const publishDate = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Sort episodes by date (newest first)
 */
export function sortEpisodesByDate<T extends { published_at?: Date | string | null; created_at?: Date | string | null }>(
  episodes: T[]
): T[] {
  return episodes.sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at || 0);
    const dateB = new Date(b.published_at || b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });
} 