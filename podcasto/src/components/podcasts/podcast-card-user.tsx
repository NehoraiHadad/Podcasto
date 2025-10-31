'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Settings, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EpisodeCostIndicator } from './episode-cost-indicator';
import type { Podcast } from '@/lib/db/api/podcasts/types';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';
import { GenerateEpisodeButton } from './generate-episode-button';
import { getBestImageUrl } from '@/lib/utils/image-url-utils';

interface PodcastCardUserProps {
  podcast: Podcast;
  episodeCount: number;
  userCredits: number;
  episodeCost: number;
}

export function PodcastCardUser({
  podcast,
  episodeCount,
  userCredits,
  episodeCost
}: PodcastCardUserProps) {
  const hasEnoughCredits = userCredits >= episodeCost;

  const truncateDescription = (text: string | null, maxLength: number = 120) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/podcasts/${podcast.id}`} className="hover:underline">
              <CardTitle className="text-lg line-clamp-2">{podcast.title}</CardTitle>
            </Link>

            <CardDescription className="mt-1.5 line-clamp-2">
              {truncateDescription(podcast.description)}
            </CardDescription>
          </div>

          {podcast.cover_image && getBestImageUrl(podcast.cover_image) && (
            <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src={getBestImageUrl(podcast.cover_image)!}
                alt={podcast.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {podcast.auto_generation_enabled && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Auto-generate enabled
            </Badge>
          )}

          {podcast.is_paused && (
            <Badge variant="outline">Paused</Badge>
          )}

          <Badge variant="outline" className="gap-1">
            <Play className="h-3 w-3" />
            {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <EpisodeCostIndicator
          userCredits={userCredits}
          episodeCost={episodeCost}
          showLabel={false}
          className="justify-start"
        />
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-3">
        {hasEnoughCredits && !podcast.is_paused && (
          <GenerateEpisodeButton
            podcastId={podcast.id}
            isPaused={podcast.is_paused}
          />
        )}
        {!hasEnoughCredits && (
          <Button disabled className="w-full">
            Insufficient credits to generate episode
          </Button>
        )}
        {podcast.is_paused && (
          <Button disabled className="w-full">
            Podcast is paused
          </Button>
        )}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1"
          >
            <Link href={`/podcasts/${podcast.id}`}>
              <Play className="mr-2 h-3 w-3" />
              View Episodes
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1"
          >
            <Link href={`/podcasts/${podcast.id}/settings`}>
              <Settings className="mr-2 h-3 w-3" />
              Settings
            </Link>
          </Button>
        </div>
        {podcast.next_scheduled_generation && podcast.auto_generation_enabled && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="h-3 w-3" />
            Next: {formatUserDate(podcast.next_scheduled_generation, DATE_FORMATS.DISPLAY_DATE)}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
