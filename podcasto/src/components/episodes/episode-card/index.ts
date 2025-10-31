import { EpisodeCardRoot } from './episode-card';
import { EpisodeCardImage } from './episode-card-image';
import { EpisodeCardTitle } from './episode-card-title';
import { EpisodeCardDownloadButton } from './episode-card-download-button';
import { EpisodeCardShareButton } from './episode-card-share-button';
import { EpisodeCardBadges } from './episode-card-badges';
import { EpisodeCardDescription } from './episode-card-description';
import { EpisodeCardDuration } from './episode-card-duration';
import { EpisodeCardAudioPlayer } from './episode-card-audio-player';
import { EpisodeCardViewButton } from './episode-card-view-button';

/**
 * EpisodeCard - Compound component for displaying episode cards
 *
 * @example
 * Simple usage with default layout:
 * ```tsx
 * <EpisodeCard episode={episode} podcastId={podcastId} />
 * ```
 *
 * @example
 * Custom composition:
 * ```tsx
 * <EpisodeCard episode={episode} podcastId={podcastId}>
 *   <EpisodeCard.Image />
 *   <EpisodeCard.Title />
 *   <EpisodeCard.DownloadButton />
 *   <EpisodeCard.ShareButton />
 *   <EpisodeCard.Badges />
 *   <EpisodeCard.Description />
 *   <EpisodeCard.Duration />
 *   <EpisodeCard.AudioPlayer />
 *   <EpisodeCard.ViewButton />
 * </EpisodeCard>
 * ```
 */
export const EpisodeCard = Object.assign(EpisodeCardRoot, {
  Image: EpisodeCardImage,
  Title: EpisodeCardTitle,
  DownloadButton: EpisodeCardDownloadButton,
  ShareButton: EpisodeCardShareButton,
  Badges: EpisodeCardBadges,
  Description: EpisodeCardDescription,
  Duration: EpisodeCardDuration,
  AudioPlayer: EpisodeCardAudioPlayer,
  ViewButton: EpisodeCardViewButton,
});

export type { EpisodeCardProps } from './types';
