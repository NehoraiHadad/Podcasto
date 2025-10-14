import { Episode } from '@/lib/db/api/episodes';

/**
 * Context value shared between EpisodeCard and its sub-components
 */
export interface EpisodeCardContextValue {
  episode: Episode;
  podcastId: string;
}

/**
 * Props for the root EpisodeCard component
 */
export interface EpisodeCardProps {
  episode: Episode;
  podcastId: string;
  children?: React.ReactNode;
}
