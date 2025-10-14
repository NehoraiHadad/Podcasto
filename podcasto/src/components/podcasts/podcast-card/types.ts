import { PodcastWithConfig } from '@/lib/db/api/podcasts';

/**
 * Context value shared between PodcastCard and its sub-components
 */
export interface PodcastCardContextValue {
  podcast: PodcastWithConfig;
}

/**
 * Props for the root PodcastCard component
 */
export interface PodcastCardProps {
  podcast: PodcastWithConfig;
  children?: React.ReactNode;
}
