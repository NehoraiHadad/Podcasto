'use client';

import {
  GenerateEpisodeButton as SharedGenerateEpisodeButton,
  type GenerateEpisodeButtonProps as SharedGenerateEpisodeButtonProps,
} from '../podcasts/generate-episode-button';

export type GenerateEpisodeButtonProps = Omit<SharedGenerateEpisodeButtonProps, 'context'>;

export function GenerateEpisodeButton(props: GenerateEpisodeButtonProps) {
  return <SharedGenerateEpisodeButton context="admin" {...props} />;
}
