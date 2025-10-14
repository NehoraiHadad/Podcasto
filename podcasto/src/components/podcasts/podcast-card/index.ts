import { PodcastCardRoot } from './podcast-card';
import { PodcastCardImage } from './podcast-card-image';
import { PodcastCardTitle } from './podcast-card-title';
import { PodcastCardEpisodeCount } from './podcast-card-episode-count';
import { PodcastCardDescription } from './podcast-card-description';
import { PodcastCardListenButton } from './podcast-card-listen-button';

/**
 * PodcastCard - Compound component for displaying podcast cards
 *
 * @example
 * Simple usage with default layout:
 * ```tsx
 * <PodcastCard podcast={podcast} />
 * ```
 *
 * @example
 * Custom composition:
 * ```tsx
 * <PodcastCard podcast={podcast}>
 *   <PodcastCard.Image />
 *   <PodcastCard.Title />
 *   <PodcastCard.EpisodeCount />
 *   <PodcastCard.Description />
 *   <PodcastCard.ListenButton />
 * </PodcastCard>
 * ```
 */
export const PodcastCard = Object.assign(PodcastCardRoot, {
  Image: PodcastCardImage,
  Title: PodcastCardTitle,
  EpisodeCount: PodcastCardEpisodeCount,
  Description: PodcastCardDescription,
  ListenButton: PodcastCardListenButton,
});

export type { PodcastCardProps } from './types';
